# Interactive Resume — Brad Belnap

A full-stack interactive resume application with an embedded AI agent. Built as a demonstration of engineering judgment alongside the resume content it presents.

**Live:** [resume.naplab.org](https://resume.naplab.org)

---

## What It Does

- Presents a polished, dark-mode resume with smooth scroll interactions
- An AI agent (Claude Sonnet) answers natural language questions about Brad's professional background
- Magic link authentication gates access to pre-approved visitors
- Architecture explorer page documents the tech stack and security decisions built into the app

## Stack

React + TypeScript + Vite + Tailwind · FastAPI · Anthropic API · Docker · Pangolin

## Setup

Clone the repo, then copy the resume template and fill in your data:

```bash
cp resume.example.json resume.json
# edit resume.json with your content
```

Copy the backend env template and add your API keys:

```bash
cp backend/.env.example backend/.env
# edit backend/.env with real values
```

Run the full stack:

```bash
docker compose -f docker/docker-compose.yml up --build
```

See `CLAUDE.md` for full architecture documentation, security requirements, and build order.

## Security

- Anthropic API key is server-side only, never in the client bundle
- Magic link auth: HMAC-SHA256 signed tokens, 15-min TTL, single-use
- Session cookies: HttpOnly, Secure, SameSite=Strict
- Security headers on every response: HSTS, CSP, X-Frame-Options, nosniff
- Rate limiting on the agent endpoint: 30 messages / 30 min per session
- Docker network isolation: backend not directly internet-exposed

## Personal Data Note

`resume.json` (real resume data) is gitignored. `resume.example.json` shows the schema. To use this project with your own content, copy the example and fill it in.
