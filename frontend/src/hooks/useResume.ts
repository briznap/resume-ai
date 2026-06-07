import { useEffect, useState } from 'react'
import { fetchResume } from '../lib/api'
import type { Resume } from '../types/resume'

// Module-level cache: the resume is fetched once per page load and reused
// across every component mount. An in-flight promise is shared so concurrent
// mounts never trigger duplicate requests.
let cache: Resume | null = null
let inflight: Promise<Resume> | null = null

function loadResume(): Promise<Resume> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetchResume()
      .then((data) => {
        cache = data
        inflight = null
        return data
      })
      .catch((err) => {
        inflight = null // allow a later retry
        throw err
      })
  }
  return inflight
}

export interface UseResumeResult {
  data: Resume | null
  loading: boolean
  error: string | null
}

export function useResume(): UseResumeResult {
  const [data, setData] = useState<Resume | null>(cache)
  const [loading, setLoading] = useState(cache === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    let active = true
    loadResume()
      .then((resume) => {
        if (!active) return
        setData(resume)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load resume')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { data, loading, error }
}
