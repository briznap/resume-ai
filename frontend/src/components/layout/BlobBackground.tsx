import { memo } from 'react'

// Animated background: three large, soft radial-gradient blobs that drift behind
// all page content. The layer is fixed and full-viewport at z-index -1, so it
// sits behind content naturally. Sizes, gradients, keyframes, animation-delays,
// and the reduced-motion fallback live in index.css.
//
// Wrapped in memo so route/state changes in the root layout don't re-render it
// and restart the CSS animation.
export const BlobBackground = memo(function BlobBackground() {
  return (
    <div className="bg-blobs" aria-hidden="true">
      <div className="blob blob--1" />
      <div className="blob blob--2" />
      <div className="blob blob--3" />
    </div>
  )
})
