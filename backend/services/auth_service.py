"""Magic-link tokens, email allowlist, and signed session tokens.

Phase 2 auth. Env vars are read at call time (not import time) so they're
available after main.py's load_dotenv(). State (issued magic-link tokens) lives
in-memory — fine for a single backend instance; a multi-instance deployment
would need shared storage.
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import time

logger = logging.getLogger("resume-ai")

# Name of the session cookie — shared by the auth router, the session
# dependency, and the rate limiter (single source of truth).
SESSION_COOKIE = "session"

TOKEN_TTL_SECONDS = 15 * 60  # magic-link lifetime
SESSION_MAX_AGE = 604800  # 7 days

# Issued magic-link tokens, keyed by the token's HMAC hash (we never store the
# raw token): {token_hash: {"email": str, "expires_at": float, "used": bool}}.
_tokens: dict[str, dict] = {}


# ── Magic-link tokens ──────────────────────────────────────────────────────

def _hmac_secret() -> bytes:
    return os.getenv("HMAC_SECRET", "").encode()


def _hash_token(token: str) -> str:
    return hmac.new(_hmac_secret(), token.encode(), hashlib.sha256).hexdigest()


def _purge_expired() -> None:
    now = time.time()
    for token_hash in [h for h, rec in _tokens.items() if rec["expires_at"] < now]:
        _tokens.pop(token_hash, None)


def create_magic_token(email: str) -> str:
    """Generate a single-use magic-link token for `email`; return the raw token."""
    token = secrets.token_urlsafe(32)
    _tokens[_hash_token(token)] = {
        "email": email,
        "expires_at": time.time() + TOKEN_TTL_SECONDS,
        "used": False,
    }
    return token


def validate_magic_token(token: str) -> str | None:
    """Return the email if the token is valid (exists, unexpired, unused), then
    mark it used. Returns None otherwise. Purges expired tokens each call."""
    _purge_expired()
    record = _tokens.get(_hash_token(token))
    if record is None or record["used"] or record["expires_at"] < time.time():
        return None
    record["used"] = True
    return record["email"]


# ── Email allowlist ────────────────────────────────────────────────────────

def is_email_allowed(email: str) -> bool:
    """Allowlist check supporting exact addresses and `@domain` wildcards.

    Entries starting with `@` match any address at that domain. Matching is
    case-insensitive. Callers must NOT expose this result to clients.
    """
    email = email.strip().lower()
    if "@" not in email:
        return False
    domain = email.rsplit("@", 1)[1]

    for entry in os.getenv("ALLOWED_EMAILS", "").split(","):
        entry = entry.strip().lower()
        if not entry:
            continue
        if entry.startswith("@"):
            if domain == entry[1:]:
                return True
        elif email == entry:
            return True
    return False


# ── Signed session tokens ──────────────────────────────────────────────────

def _session_secret() -> bytes:
    return os.getenv("SESSION_SECRET", "").encode()


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_session_token(email: str) -> str:
    """Create an HMAC-SHA256 signed session token carrying the email + expiry."""
    payload = {"email": email, "exp": int(time.time()) + SESSION_MAX_AGE}
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = hmac.new(_session_secret(), body.encode(), hashlib.sha256).digest()
    return f"{body}.{_b64encode(signature)}"


def verify_session_token(token: str) -> dict | None:
    """Validate signature + expiry; return {"email": ...} or None."""
    if not token or "." not in token:
        return None
    body, signature = token.split(".", 1)

    expected = hmac.new(_session_secret(), body.encode(), hashlib.sha256).digest()
    try:
        provided = _b64decode(signature)
    except (ValueError, TypeError):
        return None
    if not hmac.compare_digest(expected, provided):
        return None

    try:
        payload = json.loads(_b64decode(body))
    except (ValueError, TypeError):
        return None
    if not isinstance(payload, dict) or "email" not in payload:
        return None
    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    return {"email": payload["email"]}
