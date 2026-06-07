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
from routers import health, resume

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.resume = _load_resume()
    if app.state.resume is None:
        logger.warning("Starting without resume data; /api/resume will return 503.")
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
