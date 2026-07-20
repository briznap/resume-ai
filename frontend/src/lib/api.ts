// All fetch calls to the backend live here. Paths are same-origin relative
// (proxied to the backend in dev via vite.config.ts; routed by Nginx/Pangolin
// in prod), which keeps the CSP `connect-src 'self'` valid.

import type { Resume } from '../types/resume'
import type { ChatTurnDTO } from '../types/chat'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/** Thrown by sendChat so callers can show tailored messages (e.g. 429). */
export class ChatError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    credentials: 'include', // /api/resume is session-gated
  })
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`)
  }
  return (await res.json()) as T
}

export function fetchResume(): Promise<Resume> {
  return getJson<Resume>('/api/resume')
}

interface ChatResponse {
  reply: string
}

/** Send a chat message (plus prior turns) to the backend; returns the reply. */
export async function sendChat(message: string, history: ChatTurnDTO[]): Promise<string> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ message, history }),
    })
  } catch {
    throw new ChatError('Network error — please check your connection and try again.')
  }

  if (res.status === 429) {
    throw new ChatError("You've sent a lot of messages. Please wait a bit and try again.", 429)
  }
  if (!res.ok) {
    throw new ChatError('The assistant is temporarily unavailable. Please try again.', res.status)
  }

  const data = (await res.json()) as ChatResponse
  return data.reply
}

export interface SessionInfo {
  email: string
}

/** Check auth state. Returns the session (200) or null if unauthenticated (401)
 *  or the backend is unreachable. */
export async function checkSession(): Promise<SessionInfo | null> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/status`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  return (await res.json()) as SessionInfo
}

export interface AccessResult {
  ok: boolean
  /** HTTP status; 0 on network error. */
  status: number
}

/** Request a magic link. Always 200 with a generic message whether or not the
 *  email is allowlisted (no session cookie is set — the session starts when
 *  the emailed link is clicked). 429 → rate limited. */
export async function requestMagicLink(email: string): Promise<AccessResult> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include',
    })
  } catch {
    return { ok: false, status: 0 }
  }
  return { ok: res.ok, status: res.status }
}

/** Ask Brad for an invite (visitor not on the allowlist). Completely separate
 *  from the magic-link path — no allowlist involved. 429 → rate limited. */
export async function requestAccess(email: string, note?: string): Promise<AccessResult> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/request-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, note: note || null }),
    })
  } catch {
    return { ok: false, status: 0 }
  }
  return { ok: res.ok, status: res.status }
}
