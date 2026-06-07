import type { ReactNode } from 'react'

// Section eyebrow label — 11px uppercase tracked, per the Design System.
export function SectionHeader({ children }: { children: ReactNode }) {
  return <h2 className="section-header mb-6">{children}</h2>
}
