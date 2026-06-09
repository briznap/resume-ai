"""Shared FastAPI dependencies."""

from fastapi import HTTPException, Request, status

from services.auth_service import SESSION_COOKIE, is_email_allowed, verify_session_token


def get_current_session(request: Request) -> dict:
    """Validate the signed session cookie; return session data ({"email": ...}).

    Raises HTTP 401 if the cookie is missing or the signature/expiry is invalid,
    or if the email is no longer on the allowlist — sessions are stateless
    7-day tokens, so re-checking ALLOWED_EMAILS here is what makes removing an
    entry an *instant* revocation rather than a wait-for-expiry.
    """
    token = request.cookies.get(SESSION_COOKIE)
    session = verify_session_token(token) if token else None
    if session is None or not is_email_allowed(session["email"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return session
