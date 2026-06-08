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

// Hardcoded architecture of THIS application.
const LAYERS: Layer[] = [
  {
    id: 'client',
    category: 'Client',
    node: 'Browser / SPA',
    icon: <MonitorIcon />,
    name: 'Client',
    role: "The static single-page app a visitor loads — resume content, the chat UI, and the invitation auth gate. No secrets ever live here; it only talks to this app's own backend, same-origin.",
    stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Router', 'Framer Motion'],
    decisions: [
      { kind: 'security', text: 'No API keys in client code — the browser never calls Anthropic directly.' },
      { kind: 'security', text: "All requests are same-origin, satisfying the CSP connect-src 'self' policy." },
      { kind: 'design', text: 'Resume content is hydrated at runtime from GET /api/resume, not baked into the bundle.' },
      { kind: 'design', text: 'Client-side routing (/, /about, /under-the-hood) over a dark design system driven by CSS custom properties.' },
    ],
  },
  {
    id: 'gateway',
    category: 'Gateway',
    node: 'Pangolin · VPS',
    icon: <GatewayIcon />,
    name: 'Gateway (Pangolin)',
    role: 'Public DNS (Cloudflare, DNS-only) resolves straight to the self-hosted VPS, where Pangolin — a reverse proxy — terminates TLS and routes traffic to the frontend container over a private Docker network.',
    stack: ['Pangolin', 'Reverse proxy', "Let's Encrypt TLS", 'Self-hosted VPS', 'Docker network'],
    decisions: [
      { kind: 'security', text: 'Cloudflare provides DNS only — no proxy, CDN, or WAF; records resolve directly to the VPS.' },
      { kind: 'security', text: "Pangolin terminates TLS (Let's Encrypt) and routes to the frontend container over an internal network." },
      { kind: 'security', text: 'The backend publishes no ports — nothing external can reach it directly.' },
      { kind: 'design', text: 'TLS termination and container routing live at the proxy, not in application code.' },
    ],
  },
  {
    id: 'application',
    category: 'Application',
    node: 'Nginx · FastAPI',
    icon: <ServerIcon />,
    name: 'Application',
    role: 'Two containers do the work: an Nginx-served React frontend that also proxies /api to a FastAPI backend serving resume data, auth, and the agent.',
    stack: ['Python 3.12', 'FastAPI', 'uvicorn', 'slowapi', 'Nginx', 'Docker Compose'],
    decisions: [
      { kind: 'security', text: 'Security headers on every response — HSTS, CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.' },
      { kind: 'security', text: 'slowapi rate limits: 30 chat messages / 30 min per session, 5 link requests / 15 min per IP (429 + Retry-After).' },
      { kind: 'security', text: 'CORS locked to a single origin (no wildcards); the backend container runs as a non-root user.' },
      { kind: 'design', text: 'Nginx proxies /api to the backend internally; resume + agent context load at startup, so updates are a restart, not a rebuild.' },
    ],
  },
  {
    id: 'auth',
    category: 'Auth',
    node: 'Magic Link',
    icon: <KeyIcon />,
    name: 'Auth (Magic Link)',
    role: 'Access is by invitation. A visitor requests a one-time link by email; clicking it sets a signed session cookie that gates the assistant.',
    stack: ['Magic link', 'HMAC-SHA256', 'Resend', 'HttpOnly cookie'],
    decisions: [
      { kind: 'security', text: 'Single-use tokens (32-byte random, HMAC-hashed at rest) expire after 15 minutes.' },
      { kind: 'security', text: 'The session is an HMAC-signed, HttpOnly, Secure, SameSite=Strict cookie — never readable by JavaScript.' },
      { kind: 'security', text: "The request endpoint responds identically whether or not an email is allowlisted, so membership can't be enumerated." },
      { kind: 'design', text: 'Links are delivered via Resend; the chat endpoint requires a valid session to answer.' },
    ],
  },
  {
    id: 'agent',
    category: 'AI Agent',
    node: 'Claude Sonnet',
    icon: <SparkIcon />,
    name: 'AI Agent (Claude Sonnet)',
    role: "Brad's resume assistant. The backend builds a system prompt from the resume plus curated context, then proxies questions to Anthropic — the browser is never in that loop.",
    stack: ['Anthropic API', 'claude-sonnet-4-6', 'Backend proxy'],
    decisions: [
      { kind: 'security', text: 'ANTHROPIC_API_KEY lives only in backend env — never logged, never sent to the client.' },
      { kind: 'security', text: 'Input is validated before forwarding: 1000-char cap, null-byte stripping, prompt-injection pattern rejection.' },
      { kind: 'security', text: 'The system prompt refuses behavior-changing instructions and never reveals itself.' },
      { kind: 'design', text: 'Answers are grounded in the resume plus curated context; out-of-scope questions are declined.' },
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

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 11l8 8M16.5 16.5l2-2M18.5 18.5l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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
