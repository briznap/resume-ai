"""Admin endpoints.

GET /api/admin/logs — the last 100 structured log events as a JSON array.

Protected by the X-Admin-Secret header, compared in constant time
(hmac.compare_digest) against the ADMIN_SECRET env var. If ADMIN_SECRET is
unset, the endpoint is disabled (always 401) — an empty configured secret must
never match an empty header. Failures return a bare 401 with no detail about
whether the endpoint is disabled or the secret was wrong.
"""

import hmac
import os

from fastapi import APIRouter, Header, HTTPException, Request, Response

from middleware.rate_limiter import limiter
from services.logging_service import read_recent_events

router = APIRouter()


@router.get("/api/admin/logs")
@limiter.limit("10/minute")  # blunts brute-forcing of the header secret
async def get_logs(
    request: Request,
    response: Response,
    x_admin_secret: str = Header(default=""),
) -> list[dict]:
    secret = os.getenv("ADMIN_SECRET", "")
    if not secret or not hmac.compare_digest(x_admin_secret.encode(), secret.encode()):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return read_recent_events(100)
