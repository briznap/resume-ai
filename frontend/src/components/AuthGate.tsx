import { useEffect, useState } from 'react'
import { requestMagicLink } from '../lib/api'

// Full-screen, on-brand auth gate. Overlays the viewport (fixed inset-0,
// z-100) so the app underneath stays mounted. Visual language matches the hero.
//
// Two-step magic-link flow: submit email → generic "check your inbox"
// confirmation (the backend never reveals allowlist membership) → the user
// clicks the emailed link (GET /api/auth/verify), which sets the session
// cookie and redirects back to /, where the normal auth check admits them.
// A failed verification redirects to /?auth_error=1, which this component
// surfaces as an expired/invalid-link message on mount.
export function AuthGate() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [linkError, setLinkError] = useState(false)

  // Surface a failed link verification (expired / invalid / already used),
  // then clean the query param so a refresh doesn't re-show the message.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth_error') === '1') {
      setLinkError(true)
      params.delete('auth_error')
      const query = params.toString()
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (query ? `?${query}` : ''),
      )
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || status === 'loading') return
    setStatus('loading')
    setError(null)
    setLinkError(false)

    const result = await requestMagicLink(trimmed)
    if (result.ok) {
      setStatus('sent')
      return
    }
    if (result.status === 429) {
      setError('Too many requests — please wait a few minutes and try again.')
    } else {
      setError('Something went wrong. Please try again.')
    }
    setStatus('idle')
  }

  if (status === 'sent') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-bg px-6 py-16 text-center">
        <h1 className="text-[32px] font-medium leading-tight tracking-[-0.03em] text-text-primary md:text-[42px]">
          Check your inbox
        </h1>
        <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-text-secondary">
          If <span className="text-text-primary">{email.trim()}</span> is on the
          invitation list, an access link is on its way. The link expires in 15
          minutes and can be used once.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm text-accent-light underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-bg px-6 py-16 text-center">
      <h1 className="text-[32px] font-medium leading-tight tracking-[-0.03em] text-text-primary md:text-[42px]">
        Brad Belnap
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-text-secondary">
        This resume is by invitation — enter your email and we&rsquo;ll send you
        an access link.
      </p>

      {linkError && (
        <p className="mt-4 max-w-sm text-sm text-text-secondary">
          That link is expired or has already been used. Enter your email to
          request a fresh one.
        </p>
      )}

      <form onSubmit={submit} className="mt-8 w-full max-w-sm">
        <div className="agent-bar flex min-h-[48px] items-center gap-3 px-4 py-2.5">
          <MailIcon className="h-5 w-5 shrink-0 text-accent-light" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoFocus
            autoComplete="email"
            disabled={status === 'loading'}
            aria-label="Email address"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || email.trim().length === 0}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <>
              Send access link <span aria-hidden="true">→</span>
            </>
          )}
        </button>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </form>
    </div>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
