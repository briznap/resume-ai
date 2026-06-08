import type { Ref } from 'react'
import type { Resume } from '../../types/resume'
import { AgentBar } from './AgentBar'

interface HeroProps {
  resume: Resume
  /** Attached to the agent bar wrapper so the scroll observer can watch it. */
  agentBarRef?: Ref<HTMLDivElement>
  /** Submit handler for the hero agent bar. */
  onSubmit: (text: string) => void
  /** Opens the chat drawer (sparkle icon) from the hero state. */
  onOpen: () => void
}

// Centered hero that fills the viewport below the 4rem nav. Renders the name,
// title, subtitle, and hero summary from resume data, with the agent bar
// centered beneath.
export function Hero({ resume, agentBarRef, onSubmit, onOpen }: HeroProps) {
  const { name, heroTitle, heroSubtitle, summary } = resume.personal

  return (
    <section
      id="top"
      className="flex min-h-[calc(100vh-48px)] flex-col items-center justify-center px-6 py-32 text-center"
    >
      <h1 className="text-[32px] font-medium leading-tight tracking-[-0.03em] text-text-primary md:text-[42px]">
        {name}
      </h1>
      <p className="mt-4 text-base text-text-primary">{heroTitle}</p>
      <p className="mt-1 text-sm text-text-secondary">{heroSubtitle}</p>

      <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-text-secondary">
        {summary.hero}
      </p>

      <div ref={agentBarRef} className="mt-12 flex w-full justify-center">
        <AgentBar onSubmit={onSubmit} onOpen={onOpen} />
      </div>
    </section>
  )
}
