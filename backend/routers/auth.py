"""Magic-link auth endpoints (Phase 2).

POST /api/auth/request — request a link (enumeration-safe, rate limited).
GET  /api/auth/verify  — verify a token, set the session cookie, redirect.
"""

import logging
import os
import re

from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from dependencies import get_current_session
from middleware.rate_limiter import limiter
from services import auth_service, email_service
from services.auth_service import SESSION_COOKIE, SESSION_MAX_AGE

logger = logging.getLogger("resume-ai")

router = APIRouter()

# Basic format sanity check (full validation isn't the point — the allowlist is).
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Identical response whether or not the email is on the allowlist — never reveal
# allowlist membership (enumeration protection).
_GENERIC_RESPONSE = {"message": "If your email is on the list, a link is on its way"}


class AuthRequest(BaseModel):
    email: str


@router.post("/api/auth/request")
@limiter.limit("5/15 minutes")
async def request_link(
    request: Request,
    response: Response,
    body: AuthRequest,
    background_tasks: BackgroundTasks,
) -> dict:
    email = body.email.strip().lower()

    # Only generate + send for valid, allowlisted addresses — but always return
    # the same response. The email is sent in the background so response timing
    # doesn't leak allowlist membership either.
    if _EMAIL_RE.match(email) and auth_service.is_email_allowed(email):
        token = auth_service.create_magic_token(email)
        origin = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")
        link = f"{origin}/api/auth/verify?token={token}"
        background_tasks.add_task(email_service.send_magic_link, email, link)

    return _GENERIC_RESPONSE


@router.get("/api/auth/status")
async def status(session: dict = Depends(get_current_session)) -> dict:
    """Report current auth state — 200 {email} if the session cookie is valid,
    401 otherwise (via get_current_session). Used by the frontend on load."""
    return {"email": session["email"]}


@router.get("/api/auth/verify")
async def verify(token: str = "") -> RedirectResponse:
    email = auth_service.validate_magic_token(token) if token else None

    # Invalid / expired / used → redirect with a generic error flag (no detail).
    if not email:
        return RedirectResponse(url="/?auth_error=1", status_code=302)

    redirect = RedirectResponse(url="/", status_code=302)
    redirect.set_cookie(
        key=SESSION_COOKIE,
        value=auth_service.create_session_token(email),
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/",
    )
    return redirect
