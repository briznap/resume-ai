"""Shared FastAPI dependencies."""

from fastapi import HTTPException, Request, status

from services.auth_service import SESSION_COOKIE, verify_session_token


def get_current_session(request: Request) -> dict:
    """Validate the signed session cookie; return session data ({"email": ...}).

    Raises HTTP 401 if the cookie is missing or the signature/expiry is invalid.
    """
    token = request.cookies.get(SESSION_COOKIE)
    session = verify_session_token(token) if token else None
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return session
