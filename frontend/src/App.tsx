import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Nav } from './components/layout/Nav'
import { Hero } from './components/layout/Hero'
import { AgentBar } from './components/layout/AgentBar'
import { useResume } from './hooks/useResume'
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
        <Hero resume={data} agentBarRef={heroBarRef} />
        <div className="section-separator" />
        {/* Content sections (Experience, Skills, Projects, Education,
            UnderTheHood) are added in step 5. */}
      </main>

      {/* Sticky bottom AgentBar — fades in (~150ms) once the hero bar exits the
          top, fades out when it returns. Same component, same indigo glow. */}
      <AnimatePresence>
        {hasExited && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4"
          >
            <div className="pointer-events-auto flex w-full justify-center">
              <AgentBar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
