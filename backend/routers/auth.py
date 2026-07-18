"""Magic-link auth endpoints (Phase 2).

POST /api/auth/request — request a link (enumeration-safe, rate limited).
GET  /api/auth/verify  — verify a token, set the session cookie, redirect.
GET  /api/auth/status  — report current auth state (200 {email} / 401).

The response to /api/auth/request is identical whether or not the email is on
the allowlist — allowlist membership is never revealed (enumeration
protection). The email is sent as a background task so response timing doesn't
leak membership either.
"""

import os
import re

from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from dependencies import get_current_session
from middleware.rate_limiter import limiter
from services import auth_service, email_service
from services.auth_service import SESSION_COOKIE, SESSION_MAX_AGE
from services.logging_service import log_event
from services.signin_store import record_signin

router = APIRouter()

# Basic format sanity check (full validation isn't the point — the allowlist is).
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Identical response whether or not the email is on the allowlist.
_GENERIC_RESPONSE = {"message": "If your email is on the list, a link is on its way"}


class AuthRequest(BaseModel):
    # 254 chars is the RFC 5321 maximum length of an email address.
    email: str = Field(max_length=254)


def _set_session_cookie(response: Response, email: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=auth_service.create_session_token(email),
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/",
    )
    log_event("session_start", email=email)


@router.post("/api/auth/request")
@limiter.limit("5/15 minutes")
async def request_access(
    request: Request,
    response: Response,
    body: AuthRequest,
    background_tasks: BackgroundTasks,
) -> dict:
    email = body.email.strip().lower()

    if not (_EMAIL_RE.match(email) and auth_service.is_email_allowed(email)):
        log_event("auth", email=email, result="denied")
        # Additive durable record of the attempt (the log line above is untouched).
        record_signin(email=email, success=False)
        return _GENERIC_RESPONSE

    # Allowlisted → issue a single-use token and email the link. No session
    # cookie here — the session starts when the link is clicked (/api/auth/verify).
    log_event("auth", email=email, result="admitted")
    record_signin(email=email, success=True)
    token = auth_service.create_magic_token(email)
    origin = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")
    link = f"{origin}/api/auth/verify?token={token}"
    background_tasks.add_task(email_service.send_magic_link, email, link)

    return _GENERIC_RESPONSE


@router.get("/api/auth/status")
async def status(session: dict = Depends(get_current_session)) -> dict:
    """200 {email} if the session cookie is valid, 401 otherwise (via
    get_current_session). Used by the frontend on load."""
    return {"email": session["email"]}


@router.get("/api/auth/verify")
async def verify(token: str = "") -> RedirectResponse:
    """Validate a magic-link token (single-use, 15-min TTL); on success set the
    session cookie and land on the app. Invalid / expired / reused tokens
    redirect with a generic error flag (no detail)."""
    email = auth_service.validate_magic_token(token) if token else None
    if not email:
        return RedirectResponse(url="/?auth_error=1", status_code=302)

    redirect = RedirectResponse(url="/", status_code=302)
    _set_session_cookie(redirect, email)
    return redirect
