"""Rate limiter.

A single shared slowapi ``Limiter`` whose default key is the client IP address
(used by ``POST /api/auth/request``: 5 / 15 min per IP). ``POST /api/chat``
overrides the key with ``session_key_func`` so each authenticated user gets
their own 30-message quota rather than sharing one per IP.

A moving-window strategy is used so limits are true sliding windows rather than
fixed buckets that reset on a wall-clock boundary.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from services.auth_service import SESSION_COOKIE, verify_session_token

limiter = Limiter(
    key_func=get_remote_address,
    strategy="moving-window",
    headers_enabled=True,  # emit Retry-After + X-RateLimit-* headers on 429
)


def session_key_func(request: Request) -> str:
    """Rate-limit key for authenticated routes: the *verified email* inside the
    session cookie, so the quota is per user identity. Keying on the raw cookie
    value would let a user reset their quota by simply re-authenticating (each
    new cookie is a new bucket). Falls back to client IP if the cookie is
    missing or invalid (those requests 401 in the session dependency anyway)."""
    token = request.cookies.get(SESSION_COOKIE)
    session = verify_session_token(token) if token else None
    if session:
        return f"session:{session['email']}"
    return get_remote_address(request)
