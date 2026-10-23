# syntax=docker/dockerfile:1
# Frontend image — two stages: build the Vite/React app, then serve via Nginx.
# Build context is the repo root (see docker-compose.yml).

# Base images are pinned to exact tags (not floating tags) so rebuilds are
# reproducible; bump deliberately.

# ── Stage 1: build ── (Node 24 LTS; only used to compile, never shipped)
FROM node:24.22.1-alpine AS build
WORKDIR /app

# Install deps from the lockfile first (better layer caching).
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build the static site.
COPY frontend/ ./
RUN npm run build

# ── Stage 2: serve ── (nginx stable branch)
FROM nginx:1.30.6-alpine

# SPA + /api proxy config, rendered from a template at container start so the
# Pangolin network CIDR (PANGOLIN_SUBNET, set in docker-compose.yml) can be
# injected. The filter limits substitution to PANGOLIN_* variables.
ENV NGINX_ENVSUBST_FILTER=^PANGOLIN_
COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf

# Compiled static assets.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
