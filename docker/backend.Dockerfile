# syntax=docker/dockerfile:1
# Backend image — FastAPI app served by uvicorn, running as a non-root user.
# Build context is the repo root (see docker-compose.yml).

# Pinned to an exact patch tag (not a floating tag) so rebuilds are reproducible;
# bump deliberately. backend/requirements.in documents compiling the lock here.
FROM python:3.12.15-slim
WORKDIR /app

# Don't buffer stdout/stderr; don't write .pyc files.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install dependencies first (better layer caching). requirements.txt is the
# fully pinned lock (direct + transitive) compiled from requirements.in.
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source.
COPY backend/ ./

# Run as a non-root user (CLAUDE.md → Docker security).
RUN useradd --create-home --uid 1001 appuser
USER appuser

EXPOSE 8000

# --proxy-headers lets uvicorn take the client IP from the X-Forwarded-For set by
# Nginx, so slowapi's per-IP rate limiting keys on the real client IP rather
# than the Nginx container's address. Which peers are trusted to set it comes
# from the FORWARDED_ALLOW_IPS env var (uvicorn reads it natively); compose pins
# it to the frontend container's fixed address. Unset, uvicorn trusts only
# 127.0.0.1 — never "*", which would honor a client-supplied X-Forwarded-For.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
