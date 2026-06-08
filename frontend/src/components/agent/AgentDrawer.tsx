import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AgentBar } from '../layout/AgentBar'
import { AgentMessage } from './AgentMessage'
import type { ChatMessage } from '../../types/chat'

interface AgentDrawerProps {
  open: boolean
  messages: ChatMessage[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (text: string) => void
}

// Chat drawer that slides up from the bottom bar. Self-contained: it owns its
// own AnimatePresence so the backdrop (fade) and panel (slide) animate in and
// out independently when `open` toggles.
export function AgentDrawer({ open, messages, isLoading, onClose, onSubmit }: AgentDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the latest message in view as the conversation grows / while typing.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading, open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && [
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50"
        />,
        <motion.div
          key="panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-label="Resume assistant"
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4"
        >
          <div className="flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-line-strong bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="section-header">Resume Assistant</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <AgentMessage key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>

            {/* Input */}
            <div className="border-t border-line p-3">
              <AgentBar onSubmit={onSubmit} disabled={isLoading} autoFocus />
            </div>
          </div>
        </motion.div>,
      ]}
    </AnimatePresence>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-surface px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-secondary"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
