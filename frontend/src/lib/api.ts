// All fetch calls to the backend live here. Paths are same-origin relative
// (proxied to the backend in dev via vite.config.ts; routed by Nginx/Pangolin
// in prod), which keeps the CSP `connect-src 'self'` valid.

import type { Resume } from '../types/resume'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`)
  }
  return (await res.json()) as T
}

export function fetchResume(): Promise<Resume> {
  return getJson<Resume>('/api/resume')
}
