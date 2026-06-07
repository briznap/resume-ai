import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Nav } from './components/layout/Nav'
import { Hero } from './components/layout/Hero'
import { AgentBar } from './components/layout/AgentBar'
import { AgentDrawer } from './components/agent/AgentDrawer'
import { useResume } from './hooks/useResume'
import { useChat } from './hooks/useChat'
import { useHeroIntersection } from './hooks/useHeroIntersection'

// Sticky nav height (h-16 = 4rem). Used to inset the hero-bar observer so the
// bottom bar fades in exactly as the hero bar disappears behind the nav.
const NAV_HEIGHT = 64

export default function App() {
  const { data, loading, error } = useResume()
  // Hooks must run unconditionally, before the early returns below.
  const { ref: heroBarRef, hasExited } = useHeroIntersection<HTMLDivElement>({
    topOffset: NAV_HEIGHT,
  })
  const chat = useChat()

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
      <Nav resume={data} />
      <main>
        <Hero resume={data} agentBarRef={heroBarRef} onSubmit={chat.send} />
        <div className="section-separator" />
        {/* Content sections (Experience, Skills, Projects, Education,
            UnderTheHood) are added in step 5. */}
      </main>

      {/* Sticky bottom AgentBar — appears once the hero bar exits the top, but
          not while the drawer is open (the drawer has its own input). */}
      <AnimatePresence>
        {hasExited && !chat.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4"
          >
            <div className="pointer-events-auto flex w-full justify-center">
              <AgentBar onSubmit={chat.send} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AgentDrawer
        open={chat.isOpen}
        messages={chat.messages}
        isLoading={chat.isLoading}
        onClose={chat.close}
        onSubmit={chat.send}
      />
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
