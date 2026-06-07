import type { Ref } from 'react'
import type { Resume } from '../../types/resume'
import { AgentBar } from './AgentBar'

interface HeroProps {
  resume: Resume
  /** Attached to the agent bar wrapper so the scroll observer can watch it. */
  agentBarRef?: Ref<HTMLDivElement>
  /** Submit handler for the hero agent bar. */
  onSubmit: (text: string) => void
}

// Centered hero that fills the viewport below the 4rem nav. Renders the name,
// title, subtitle, and hero summary from resume data, with the agent bar
// centered beneath.
export function Hero({ resume, agentBarRef, onSubmit }: HeroProps) {
  const { name, heroTitle, heroSubtitle, summary } = resume.personal

  return (
    <section
      id="top"
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center"
    >
      <h1 className="text-[28px] font-medium text-text-primary">{name}</h1>
      <p className="mt-2 text-base text-text-primary">{heroTitle}</p>
      <p className="mt-1 text-sm text-text-secondary">{heroSubtitle}</p>

      <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-text-secondary">
        {summary.hero}
      </p>

      <div ref={agentBarRef} className="mt-10 flex w-full justify-center">
        <AgentBar onSubmit={onSubmit} />
      </div>
    </section>
  )
}
