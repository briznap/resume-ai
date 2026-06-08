import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { requestMagicLink } from '../lib/api'

type Status = 'idle' | 'loading' | 'sent'

// Full-screen, on-brand auth gate. Overlays the viewport (fixed inset-0,
// z-100) so the app underneath stays mounted. Visual language matches the hero.
export function AuthGate() {
  const [params] = useSearchParams()
  const linkError = params.get('auth_error') === '1'

  const [status, setStatus] = useState<Status>('idle')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || status === 'loading') return
    setStatus('loading')
    setError(null)
    try {
      await requestMagicLink(trimmed)
      setStatus('sent')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-bg px-6 py-16 text-center">
      <h1 className="text-[32px] font-medium leading-tight tracking-[-0.03em] text-text-primary md:text-[42px]">
        Brad Belnap
      </h1>

      {status === 'sent' ? (
        <div className="mt-8 w-full max-w-sm rounded-xl border border-line bg-surface px-6 py-5">
          <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-full bg-[rgba(99,102,241,0.15)] text-accent-light">
            <MailIcon className="h-5 w-5" />
          </div>
          <p className="text-[15px] text-text-primary">Check your email</p>
          <p className="mt-1 text-sm text-text-secondary">Your link expires in 15 minutes.</p>
        </div>
      ) : (
        <>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-text-secondary">
            This resume is by invitation — enter your email to continue.
          </p>

          {linkError && (
            <p className="mt-4 max-w-sm text-sm text-text-tertiary">
              That link has expired or already been used. Request a new one.
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
        </>
      )}
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
