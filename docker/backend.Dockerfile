# syntax=docker/dockerfile:1
# Backend image — FastAPI app served by uvicorn, running as a non-root user.
# Build context is the repo root (see docker-compose.yml).

FROM python:3.12-slim
WORKDIR /app

# Don't buffer stdout/stderr; don't write .pyc files.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install dependencies first (better layer caching).
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source.
COPY backend/ ./

# Run as a non-root user (CLAUDE.md → Docker security).
RUN useradd --create-home --uid 1001 appuser
USER appuser

EXPOSE 8000

# --proxy-headers + --forwarded-allow-ips lets uvicorn trust the X-Forwarded-For
# set by Nginx so slowapi's per-IP rate limiting keys on the real client IP
# rather than the Nginx container's address.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--proxy-headers", "--forwarded-allow-ips", "*"]
