import { useEffect, useState } from 'react'

interface Options {
  /**
   * Pixels to inset the observation root from the top of the viewport — set
   * this to the sticky nav height so the hero bar counts as "exited" the moment
   * it slips behind the opaque nav, not only when it clears the very top edge.
   * Without this there would be a window where neither bar is visible.
   */
  topOffset?: number
}

interface HeroIntersectionResult<T extends Element> {
  /** Attach to the hero agent bar's wrapper element. */
  ref: (node: T | null) => void
  /** True once the hero bar has scrolled up past the (nav-inset) top edge. */
  hasExited: boolean
}

/**
 * Watches the hero agent bar with an IntersectionObserver. The hero bar lives
 * in the first viewport and only ever leaves via the top, so "not intersecting"
 * means the user has scrolled down past it — the cue to fade in the sticky
 * bottom AgentBar (see CLAUDE.md → Scroll Behavior).
 *
 * Uses a callback ref (not useRef) so the observer attaches correctly even
 * though the hero mounts after the initial render, once resume data loads.
 */
export function useHeroIntersection<T extends Element = HTMLElement>(
  options: Options = {},
): HeroIntersectionResult<T> {
  const { topOffset = 0 } = options
  const [node, setNode] = useState<T | null>(null)
  const [hasExited, setHasExited] = useState(false)

  useEffect(() => {
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHasExited(!entry.isIntersecting)
      },
      { root: null, rootMargin: `-${topOffset}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, topOffset])

  return { ref: setNode, hasExited }
}
