"""Admin endpoints — a separate trust boundary from recruiter auth.

These routes are *not* reachable with recruiter allowlist/session-cookie
credentials. They are gated at the app level by a static admin secret sent in a
request header, compared in constant time (hmac.compare_digest). If the secret
env var is unset the route is disabled (always 401) — an empty configured
secret must never match an empty header. Failures return a bare 401 with no
detail about whether the route is disabled or the secret was simply wrong.

Two-layer scheme (see CLAUDE.md → Security Standards): in production Pangolin
ALSO enforces a static `X-Pangolin-Admin-Key` header at the proxy before a
request ever reaches this app. That layer uses a *different* secret value and is
configured in the Pangolin dashboard, not here.

Routes:
  GET /api/admin/logs            — last 100 structured log events (X-Admin-Secret).
  GET /api/admin/signins         — sign-in rows, filterable (X-Admin-Key).
  GET /api/admin/signins/count   — aggregate sign-in count (X-Admin-Key).
  GET /api/admin/access-requests — invite requests, filterable (X-Admin-Key).
"""

import hmac
import os

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response

from middleware.rate_limiter import limiter
from services.access_request_store import list_access_requests
from services.logging_service import read_recent_events
from services.signin_store import count_signins, query_signins

router = APIRouter()


def require_admin_api_key(x_admin_key: str = Header(default="")) -> None:
    """App-level admin gate for the sign-in query API. Uses ADMIN_API_KEY —
    intentionally a *different* secret from the recruiter auth and from the
    /api/admin/logs secret. Unset key → always 401 (endpoint disabled)."""
    key = os.getenv("ADMIN_API_KEY", "")
    if not key or not hmac.compare_digest(x_admin_key.encode(), key.encode()):
        raise HTTPException(status_code=401, detail="Not authenticated")


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


@router.get("/api/admin/signins")
@limiter.limit("30/minute")
async def list_signins(
    request: Request,
    response: Response,
    email: str | None = Query(default=None, max_length=254),
    days: int | None = Query(default=None, ge=1),
    limit: int | None = Query(default=None, ge=1, le=1000),
    _: None = Depends(require_admin_api_key),
) -> list[dict]:
    """Sign-in attempts, most recent first. No filters + limit=1 answers "who
    signed in last"; email= answers "has user X signed in / their history"."""
    return query_signins(email=email, days=days, limit=limit)


@router.get("/api/admin/access-requests")
@limiter.limit("30/minute")
async def list_access_request_rows(
    request: Request,
    response: Response,
    email: str | None = Query(default=None, max_length=254),
    days: int | None = Query(default=None, ge=1),
    limit: int | None = Query(default=None, ge=1, le=1000),
    _: None = Depends(require_admin_api_key),
) -> list[dict]:
    """Invite requests from non-allowlisted visitors, most recent first.
    Repeat requests within 24h are deduped at write time, so each row is one
    distinct ask."""
    return list_access_requests(email=email, days=days, limit=limit)


@router.get("/api/admin/signins/count")
@limiter.limit("30/minute")
async def signins_count(
    request: Request,
    response: Response,
    email: str | None = Query(default=None, max_length=254),
    days: int | None = Query(default=None, ge=1),
    _: None = Depends(require_admin_api_key),
) -> dict:
    """Aggregate count of sign-in attempts. days=N answers "how many sign-ins in
    the past N days"; combine with email= to scope to one address."""
    return {"count": count_signins(email=email, days=days)}
