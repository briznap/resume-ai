# syntax=docker/dockerfile:1
# Frontend image — two stages: build the Vite/React app, then serve via Nginx.
# Build context is the repo root (see docker-compose.yml).

# ── Stage 1: build ──
FROM node:20-alpine AS build
WORKDIR /app

# Install deps from the lockfile first (better layer caching).
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build the static site.
COPY frontend/ ./
RUN npm run build

# ── Stage 2: serve ──
FROM nginx:alpine

# SPA + /api proxy config.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Compiled static assets.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
