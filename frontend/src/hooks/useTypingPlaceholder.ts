import { useEffect, useState } from 'react'

const TYPE_MS = 60 // per-character typing delay
const DELETE_MS = 30 // per-character deleting delay
const PAUSE_MS = 2500 // hold the full prompt before deleting
const REDUCED_ROTATE_MS = 4000 // reduced-motion: static rotation interval

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Cycles through `prompts` with a typewriter effect (type → pause → delete →
 * next). Returns the text to display plus whether the blinking cursor should
 * show (cursor shows while typing/deleting, hidden during the pause).
 *
 * Pass an empty array to disable (e.g. inside the drawer, where the user is
 * already engaged). Respects prefers-reduced-motion: no per-character animation,
 * just a plain rotation every few seconds with no cursor.
 */
export function useTypingPlaceholder(prompts: string[]): { text: string; showCursor: boolean } {
  const [text, setText] = useState('')
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    if (prompts.length === 0) {
      setText('')
      setShowCursor(false)
      return
    }

    let timer: ReturnType<typeof setTimeout>
    let promptIndex = 0

    // Reduced motion: rotate full prompts, no animation, no cursor.
    if (prefersReducedMotion()) {
      setShowCursor(false)
      const rotate = () => {
        setText(prompts[promptIndex % prompts.length])
        promptIndex += 1
        timer = setTimeout(rotate, REDUCED_ROTATE_MS)
      }
      rotate()
      return () => clearTimeout(timer)
    }

    let charIndex = 0
    let phase: 'typing' | 'pausing' | 'deleting' = 'typing'

    const tick = () => {
      const current = prompts[promptIndex % prompts.length]

      if (phase === 'typing') {
        charIndex += 1
        setText(current.slice(0, charIndex))
        if (charIndex >= current.length) {
          phase = 'pausing'
          setShowCursor(false) // no cursor while paused
          timer = setTimeout(tick, PAUSE_MS)
        } else {
          setShowCursor(true)
          timer = setTimeout(tick, TYPE_MS)
        }
      } else if (phase === 'pausing') {
        phase = 'deleting'
        setShowCursor(true)
        timer = setTimeout(tick, DELETE_MS)
      } else {
        charIndex -= 1
        setText(current.slice(0, Math.max(0, charIndex)))
        if (charIndex <= 0) {
          phase = 'typing'
          promptIndex += 1
          timer = setTimeout(tick, TYPE_MS)
        } else {
          setShowCursor(true)
          timer = setTimeout(tick, DELETE_MS)
        }
      }
    }

    setShowCursor(true)
    timer = setTimeout(tick, TYPE_MS)
    return () => clearTimeout(timer)
  }, [prompts])

  return { text, showCursor }
}
