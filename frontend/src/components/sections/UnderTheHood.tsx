import { useState, type ReactNode } from 'react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../ui/SectionHeader'

type DecisionKind = 'security' | 'design'

interface Decision {
  kind: DecisionKind
  text: string
}

interface Layer {
  id: string
  category: string // short node label, e.g. "Client"
  node: string // sub-label, e.g. "Browser / SPA"
  icon: ReactNode
  name: string // detail-panel title
  role: string // role description
  stack: string[]
  decisions: Decision[]
}

// Hardcoded architecture of THIS application, drawn from CLAUDE.md.
const LAYERS: Layer[] = [
  {
    id: 'client',
    category: 'Client',
    node: 'Browser / SPA',
    icon: <MonitorIcon />,
    name: 'Client',
    role: "The static single-page app a visitor loads — resume content plus the chat UI. No secrets ever live here; it only talks to this app's own backend.",
    stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion'],
    decisions: [
      { kind: 'security', text: 'No API keys in client code — the browser never calls Anthropic directly.' },
      { kind: 'security', text: "All requests are same-origin, satisfying the CSP connect-src 'self' policy." },
      { kind: 'design', text: 'Resume content is hydrated at runtime from GET /api/resume, not baked into the bundle.' },
      { kind: 'design', text: 'Dark-mode design system driven entirely by CSS custom properties.' },
    ],
  },
  {
    id: 'edge',
    category: 'Edge',
    node: 'Cloudflare',
    icon: <CloudIcon />,
    name: 'Edge (Cloudflare)',
    role: 'The public entry point in front of the origin — DNS, global TLS, and edge protection before any traffic reaches the VPS.',
    stack: ['Cloudflare DNS', 'Edge TLS', 'CDN cache', 'DDoS / bot mitigation'],
    decisions: [
      { kind: 'security', text: 'Edge TLS and DDoS/bot mitigation shield the origin from direct exposure.' },
      { kind: 'security', text: 'The origin server sits behind Cloudflare rather than being published in DNS.' },
      { kind: 'design', text: 'Static assets are cacheable at the edge for fast global loads.' },
    ],
  },
  {
    id: 'gateway',
    category: 'Gateway',
    node: 'Pangolin · VPS',
    icon: <GatewayIcon />,
    name: 'Gateway (Pangolin)',
    role: 'A reverse proxy on the self-hosted VPS — terminates origin TLS, routes to the right container, and (Phase 1) gates the whole app with its built-in auth.',
    stack: ['Pangolin', 'Reverse proxy', 'Self-hosted VPS', 'Docker network'],
    decisions: [
      { kind: 'security', text: 'Phase 1 auth is handled here at the proxy — the app ships zero auth code until Phase 2.' },
      { kind: 'security', text: "The backend port is never exposed to the host; only Pangolin can reach it." },
      { kind: 'design', text: 'Routes /api to the FastAPI backend and everything else to the Nginx frontend.' },
      { kind: 'design', text: 'TLS termination and container routing live here, not in application code.' },
    ],
  },
  {
    id: 'application',
    category: 'Application',
    node: 'FastAPI · React',
    icon: <ServerIcon />,
    name: 'Application',
    role: 'Two containers doing the work: a FastAPI backend that proxies the agent and serves resume data, and a Nginx-served React frontend.',
    stack: ['Python 3.12', 'FastAPI', 'uvicorn', 'slowapi', 'Nginx', 'Docker Compose'],
    decisions: [
      { kind: 'security', text: 'Security headers on every response — HSTS, CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.' },
      { kind: 'security', text: 'Per-IP rate limiting on /api/chat — 30 requests / 30 min, returning 429 + Retry-After on breach.' },
      { kind: 'security', text: 'CORS locked to a single FRONTEND_ORIGIN (no wildcards); the backend container runs as a non-root user.' },
      { kind: 'design', text: 'Resume content is loaded from resume.json at startup — updating it is a restart, not a rebuild.' },
    ],
  },
  {
    id: 'agent',
    category: 'AI Agent',
    node: 'Claude Sonnet',
    icon: <SparkIcon />,
    name: 'AI Agent (Claude Sonnet)',
    role: "Brad's resume assistant. The backend builds a system prompt from resume.json and proxies questions to Anthropic — the browser is never in that loop.",
    stack: ['Anthropic API', 'claude-sonnet-4-6', 'Backend proxy'],
    decisions: [
      { kind: 'security', text: 'ANTHROPIC_API_KEY lives only in backend env — never logged, never sent to the client.' },
      { kind: 'security', text: 'Input is validated before forwarding: 1000-char cap, null-byte stripping, prompt-injection pattern rejection.' },
      { kind: 'security', text: 'The system prompt refuses behavior-changing instructions and never reveals itself.' },
      { kind: 'design', text: 'Answers are grounded solely in resume.json; out-of-scope questions are declined.' },
    ],
  },
]

export function UnderTheHood() {
  const [selectedId, setSelectedId] = useState(LAYERS[0].id)
  const selected = LAYERS.find((l) => l.id === selectedId) ?? LAYERS[0]

  return (
    <section id="under-the-hood" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-16">
      <SectionHeader>Under the Hood</SectionHeader>

      {/* Layer nodes — a horizontal row that scrolls on narrow screens. */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {LAYERS.map((layer) => {
          const active = layer.id === selectedId
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setSelectedId(layer.id)}
              aria-pressed={active}
              className={`flex min-w-[7.5rem] flex-1 flex-col gap-1.5 rounded-lg border bg-surface px-3 py-3 text-left transition-colors ${
                active ? 'border-[rgba(99,102,241,0.5)]' : 'border-line hover:border-line-strong'
              }`}
            >
              <span className={active ? 'text-accent-light' : 'text-text-secondary'}>
                {layer.icon}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
                {layer.category}
              </span>
              <span
                className={`text-xs font-medium ${active ? 'text-text-primary' : 'text-text-secondary'}`}
              >
                {layer.node}
              </span>
              {/* Thin indigo accent bar */}
              <span
                className={`mt-1 h-0.5 w-full rounded-full ${
                  active ? 'bg-accent' : 'bg-[rgba(99,102,241,0.2)]'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* Detail panel */}
      <Card className="mt-4">
        <h3 className="text-xl font-medium text-text-primary">{selected.name}</h3>
        <p className="mt-1.5 text-base leading-relaxed text-text-secondary">{selected.role}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {selected.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-line bg-bg px-2 py-1 text-xs text-text-secondary"
            >
              {tech}
            </span>
          ))}
        </div>

        <ul className="mt-5 space-y-2.5">
          {selected.decisions.map((decision, i) => (
            <li key={i} className="flex gap-2.5 text-base leading-relaxed text-text-secondary">
              <span className="mt-0.5 shrink-0 text-accent-light">
                {decision.kind === 'security' ? <ShieldIcon /> : <BoltIcon />}
              </span>
              <span className="leading-relaxed">{decision.text}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

/* ── Icons (inline SVG, no external deps) ── */

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 20h6M12 16v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 18a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0117.5 18H7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GatewayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 3l8 3v5c0 4.5-3.2 7.5-8 9-4.8-1.5-8-4.5-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="13" width="18" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7.5h.01M7 16.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.8 4.6L18.4 9.4 13.8 11.2 12 15.8 10.2 11.2 5.6 9.4 10.2 7.6 12 3z"
        fill="currentColor"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 2.5V11c0 4-2.8 6.6-7 8-4.2-1.4-7-4-7-8V5.5L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
