import { useState } from 'react'
import { requestAccess } from '../lib/api'

// Full-screen, on-brand auth gate. Overlays the viewport (fixed inset-0,
// z-100) so the app underneath stays mounted. Visual language matches the hero.
//
// Flow: submit email → 200 means the session cookie is set, so reload into the
// app; 403 means not on the invite list, so show how to reach Brad.
export function AuthGate() {
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [email, setEmail] = useState('')
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || status === 'loading') return
    setStatus('loading')
    setDenied(false)
    setError(null)

    const result = await requestAccess(trimmed)
    if (result.ok) {
      // Session cookie is set — reload so App re-checks auth and shows the app.
      window.location.href = '/'
      return
    }
    if (result.status === 403) {
      setDenied(true)
    } else {
      setError('Something went wrong. Please try again.')
    }
    setStatus('idle')
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-bg px-6 py-16 text-center">
      <h1 className="text-[32px] font-medium leading-tight tracking-[-0.03em] text-text-primary md:text-[42px]">
        Brad Belnap
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-text-secondary">
        This resume is by invitation — enter your email to continue.
      </p>

      {denied && (
        <p className="mt-4 max-w-sm text-sm text-text-secondary">
          Access to this resume is invitation-only.{' '}
          <a
            href="mailto:belnapbrad@gmail.com"
            className="text-accent-light underline underline-offset-2"
          >
            Contact Brad directly
          </a>
          .
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
              Continue <span aria-hidden="true">→</span>
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
