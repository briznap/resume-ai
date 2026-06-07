import { useOutletContext } from 'react-router-dom'
import { Hero } from '../components/layout/Hero'
import { StickyAgentBar } from '../components/layout/StickyAgentBar'
import { Experience } from '../components/sections/Experience'
import { Skills } from '../components/sections/Skills'
import { Projects } from '../components/sections/Projects'
import { Education } from '../components/sections/Education'
import { useResume } from '../hooks/useResume'
import { useHeroIntersection } from '../hooks/useHeroIntersection'
import type { AppOutletContext } from '../App'

// Sticky nav height (h-16 = 4rem). Insets the hero-bar observer so the sticky
// bar fades in exactly as the hero bar disappears behind the nav.
const NAV_HEIGHT = 64

export default function HomePage() {
  const chat = useOutletContext<AppOutletContext>()
  const { data } = useResume() // cached; resolved before the layout renders pages
  const { ref: heroBarRef, hasExited } = useHeroIntersection<HTMLDivElement>({
    topOffset: NAV_HEIGHT,
  })

  if (!data) return null

  return (
    <>
      <main className="pb-20">
        <Hero resume={data} agentBarRef={heroBarRef} onSubmit={chat.send} />
        <div className="section-separator" />
        <Experience />
        <Skills />
        <Projects />
        <Education />
      </main>

      {/* On home, the sticky bar appears once the hero bar has scrolled away. */}
      <StickyAgentBar
        visible={hasExited && !chat.isOpen}
        onSubmit={chat.send}
        onOpen={chat.open}
        messageCount={chat.messages.length}
      />
    </>
  )
}
