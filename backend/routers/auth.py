"""Auth endpoints.

POST /api/auth/request — allowlist check → set the session cookie (200) or 403.
GET  /api/auth/status  — report current auth state (200 {email} / 401).
GET  /api/auth/verify  — legacy magic-link verification (no longer issued; kept
                          for potential future use).

Access is granted immediately on an allowlist match — no email is sent — so the
result is not hidden (there's nothing to enumerate beyond what the allowlist
already gates, and email delivery is no longer in the loop).
"""

import re

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from dependencies import get_current_session
from middleware.rate_limiter import limiter
from services import auth_service
from services.auth_service import SESSION_COOKIE, SESSION_MAX_AGE
from services.logging_service import log_event
from services.signin_store import record_signin

router = APIRouter()

# Basic format sanity check (full validation isn't the point — the allowlist is).
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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
async def request_access(request: Request, response: Response, body: AuthRequest) -> dict:
    email = body.email.strip().lower()

    if not (_EMAIL_RE.match(email) and auth_service.is_email_allowed(email)):
        log_event("auth", email=email, result="denied")
        # Additive durable record of the attempt (the log line above is untouched).
        record_signin(email=email, success=False)
        response.status_code = 403
        return {"message": "Access to this resume is invitation-only. Contact Brad directly."}

    # Allowlisted → authenticate immediately by setting the signed session cookie.
    log_event("auth", email=email, result="admitted")
    record_signin(email=email, success=True)
    _set_session_cookie(response, email)
    return {"authenticated": True}


@router.get("/api/auth/status")
async def status(session: dict = Depends(get_current_session)) -> dict:
    """200 {email} if the session cookie is valid, 401 otherwise (via
    get_current_session). Used by the frontend on load."""
    return {"email": session["email"]}


@router.get("/api/auth/verify")
async def verify(token: str = "") -> RedirectResponse:
    """Legacy magic-link verification. No links are issued anymore, so this only
    succeeds for a still-valid token (none exist in the current flow)."""
    email = auth_service.validate_magic_token(token) if token else None
    if not email:
        return RedirectResponse(url="/?auth_error=1", status_code=302)

    redirect = RedirectResponse(url="/", status_code=302)
    _set_session_cookie(redirect, email)
    return redirect
