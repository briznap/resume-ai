"""Per-IP rate limiter (Phase 1).

A single shared slowapi ``Limiter`` instance, keyed on the client IP address.
Phase 1 keys on IP; Phase 2 will switch the key function to the session
cookie (see CLAUDE.md → Build Order). Routes opt in to limits with the
``@limiter.limit(...)`` decorator — e.g. ``POST /api/chat`` gets
``"30/30 minutes"`` in step 4. No global default limit is applied, so
``/health`` and ``/api/resume`` are unthrottled.

A moving-window strategy is used so the limit is a true sliding window rather
than a fixed bucket that resets on a wall-clock boundary.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    strategy="moving-window",
    headers_enabled=True,  # emit Retry-After + X-RateLimit-* headers on 429
)
