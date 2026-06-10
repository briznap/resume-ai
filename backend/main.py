"""FastAPI application entrypoint — Phase 1 backend skeleton.

Wires up:
  - resume.json load at startup (from RESUME_PATH)
  - CORS locked to FRONTEND_ORIGIN (no wildcards)
  - security headers on every response
  - per-IP rate limiter (slowapi)
  - routers: GET /health, GET /api/resume

See CLAUDE.md for the full set of requirements these choices satisfy.
"""

import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware

from middleware.rate_limiter import limiter
from middleware.security_headers import SecurityHeadersMiddleware
from routers import admin, agent, auth, health, resume
from services.agent_service import AgentService

load_dotenv()

logger = logging.getLogger("resume-ai")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "")
RESUME_PATH = os.getenv("RESUME_PATH", "/app/resume.json")
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")


def _load_resume() -> dict | None:
    """Load and parse resume.json from RESUME_PATH. Returns None on failure."""
    path = Path(RESUME_PATH)
    try:
        with path.open(encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error("Resume file not found at %s", path)
    except json.JSONDecodeError as exc:
        logger.error("Resume file at %s is not valid JSON: %s", path, exc)
    except OSError as exc:
        logger.error("Could not read resume file at %s: %s", path, exc)
    return None


def _validate_secrets() -> None:
    """Fail fast if the signing secrets are missing or too short.

    Without this, an unset SESSION_SECRET would silently sign session cookies
    with an empty HMAC key — forgeable by anyone. A misconfigured deploy must
    be loudly broken, not silently insecure: production refuses to start.
    """
    weak = [name for name in ("SESSION_SECRET", "HMAC_SECRET") if len(os.getenv(name, "")) < 32]
    if not weak:
        return
    message = (
        f"Refusing insecure start: {', '.join(weak)} missing or shorter than 32 chars. "
        'Generate with: python3 -c "import secrets; print(secrets.token_hex(32))"'
    )
    if ENVIRONMENT == "production":
        raise RuntimeError(message)
    logger.warning("%s (continuing because ENVIRONMENT=%s)", message, ENVIRONMENT)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_secrets()
    app.state.resume = _load_resume()
    if app.state.resume is None:
        logger.warning("Starting without resume data; /api/resume will return 503.")

    # Build the agent service once at startup (system prompt from resume.json).
    # Requires both a loaded resume and an API key; otherwise /api/chat -> 503.
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if app.state.resume and api_key:
        app.state.agent_service = AgentService(app.state.resume, api_key)
    else:
        app.state.agent_service = None
        logger.warning(
            "Agent service not configured (missing resume or ANTHROPIC_API_KEY); "
            "/api/chat will return 503."
        )
    yield


app = FastAPI(
    title="Brad Belnap — Interactive Resume API",
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None,
    openapi_url=None if ENVIRONMENT == "production" else "/openapi.json",
    lifespan=lifespan,
)

# Rate limiter wiring (per-IP). Routes opt in via @limiter.limit(...).
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Middleware ---
# Order note: middleware added later becomes outermost in Starlette, so it runs
# last on the way out. SecurityHeadersMiddleware is added last so it stamps its
# headers onto *every* response — including CORS preflights and the 429.
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN] if FRONTEND_ORIGIN else [],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
app.add_middleware(SecurityHeadersMiddleware)

# --- Routers ---
app.include_router(health.router)
app.include_router(resume.router)
app.include_router(agent.router)
app.include_router(auth.router)
app.include_router(admin.router)
