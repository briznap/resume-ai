import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './components/layout/Nav'
import { BlobBackground } from './components/layout/BlobBackground'
import { AuthGate } from './components/AuthGate'
import { AgentDrawer } from './components/agent/AgentDrawer'
import { useResume } from './hooks/useResume'
import { useChat, type UseChatResult } from './hooks/useChat'
import { checkSession } from './lib/api'

// Context handed to route pages via <Outlet> so they share one conversation.
export type AppOutletContext = UseChatResult

type AuthState = 'checking' | 'in' | 'out'

// Root layout shared by every route: animated background, nav, the chat drawer,
// and the shared chat state. Pages render into <Outlet> and read chat via
// useOutletContext<AppOutletContext>().
export default function App() {
  const location = useLocation()
  const [authState, setAuthState] = useState<AuthState>('checking')

  // GET /api/resume requires a session, so only fetch once auth is confirmed —
  // an earlier fetch would 401 and show a load error instead of the gate.
  const { data, loading, error } = useResume(authState === 'in')

  // Re-show the gate if a session expires mid-use (chat 401).
  const handleUnauthorized = useCallback(() => setAuthState('out'), [])
  const chat = useChat(handleUnauthorized)

  // Check auth on mount.
  useEffect(() => {
    let active = true
    checkSession()
      .then((session) => {
        if (active) setAuthState(session ? 'in' : 'out')
      })
      .catch(() => {
        if (active) setAuthState('out')
      })
    return () => {
      active = false
    }
  }, [])

  // Bug 1: On navigation, scroll to top — unless there's a hash, in which case
  // scroll the target section into view instead. The 50ms timeout lets the page
  // render first; `data` is a dependency so that after a full reload (e.g. a
  // "/#experience" link from another page), the effect re-runs once the resume
  // has loaded and the section actually exists in the DOM.
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
      return () => clearTimeout(timer)
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname, location.hash, data])

  // Bug 2a: close the chat drawer whenever the route changes.
  useEffect(() => {
    chat.close()
  }, [location.pathname, chat.close])

  if (authState === 'checking') {
    return <FullScreenMessage>Loading…</FullScreenMessage>
  }

  // Unauthenticated with nothing loaded yet (first visit / expired cookie):
  // just the gate. Once `data` exists (session expired mid-use), fall through
  // so the app stays mounted and the gate overlays it instead.
  if (authState === 'out' && !data) {
    return (
      <>
        <BlobBackground />
        <AuthGate />
      </>
    )
  }

  if (loading) {
    return <FullScreenMessage>Loading…</FullScreenMessage>
  }
  if (error || !data) {
    return (
      <FullScreenMessage>
        Couldn’t load resume data{error ? ` — ${error}` : ''}.
      </FullScreenMessage>
    )
  }

  return (
    <>
      {/* Animated background — first child, sits behind all content. */}
      <BlobBackground />

      <Nav resume={data} />

      <Outlet context={chat satisfies AppOutletContext} />

      <AgentDrawer
        open={chat.isOpen}
        messages={chat.messages}
        isLoading={chat.isLoading}
        onClose={chat.close}
        onSubmit={chat.send}
      />

      {authState === 'out' && <AuthGate />}
    </>
  )
}

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center text-sm text-text-secondary">
      {children}
    </div>
  )
}
