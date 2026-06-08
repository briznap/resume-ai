import type { ReactNode } from 'react'

// Surface card per the Design System (--color-surface, subtle border, rounded).
// Extra classes can be appended; padding is baked in so callers stay consistent.
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</div>
  )
}
