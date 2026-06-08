import { useState } from 'react'
import { useTypingPlaceholder } from '../../hooks/useTypingPlaceholder'
import { SUGGESTED_PROMPTS } from '../../lib/prompts'

// Shared agent input bar. Used in three places — centered in the hero, as the
// sticky bottom bar, and as the input inside the chat drawer — all driving the
// same conversation. Styling comes from the `.agent-bar` class (Design System).

// Stable empty array so passing "no animation" doesn't churn the hook effect.
const NO_PROMPTS: string[] = []

interface AgentBarProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  autoFocus?: boolean
  /** Placeholder shown when focused / typing (the typewriter overlay is hidden then). */
  placeholder?: string
  /** If provided, the sparkle icon becomes a button that opens the drawer. */
  onOpen?: () => void
  /** When > 0, a subtle pill shows the conversation length. */
  messageCount?: number
  /** Controlled input value (used by the drawer so chips can prefill it). */
  value?: string
  onValueChange?: (value: string) => void
  /** Run the cycling typewriter placeholder (default true; drawer passes false). */
  animatePlaceholder?: boolean
}

export function AgentBar({
  onSubmit,
  disabled = false,
  autoFocus = false,
  placeholder = "Ask me anything about Brad's background…",
  onOpen,
  messageCount = 0,
  value,
  onValueChange,
  animatePlaceholder = true,
}: AgentBarProps) {
  const [internalValue, setInternalValue] = useState('')
  const [focused, setFocused] = useState(false)

  const isControlled = value !== undefined && onValueChange !== undefined
  const text = isControlled ? value : internalValue
  const setText = (next: string) => {
    if (isControlled) onValueChange(next)
    else setInternalValue(next)
  }

  // Typewriter overlay — only when animating, the input is empty, and unfocused.
  const { text: typed, showCursor } = useTypingPlaceholder(
    animatePlaceholder ? SUGGESTED_PROMPTS : NO_PROMPTS,
  )
  const overlayVisible = animatePlaceholder && !text && !focused

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setText('')
  }

  return (
    <form
      className="agent-bar flex min-h-[48px] w-full max-w-xl items-center gap-3 px-4 py-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {/* Left: opens the conversation drawer when onOpen is provided (hero +
          sticky bars), otherwise a plain decorative icon (drawer input). */}
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          title="Open conversation"
          aria-label="Open conversation"
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-accent-light transition-colors hover:bg-[rgba(99,102,241,0.18)]"
        >
          <SparkleIcon className="h-5 w-5" />
        </button>
      ) : (
        <SparkleIcon className="h-5 w-5 shrink-0 text-accent-light" />
      )}

      <div className="relative flex min-w-0 flex-1 items-center">
        {overlayVisible && (
          <div
            className="pointer-events-none absolute inset-0 z-0 flex items-center overflow-hidden whitespace-nowrap text-sm text-text-secondary"
            aria-hidden="true"
          >
            <span>{typed}</span>
            {showCursor && <span className="type-cursor">|</span>}
          </div>
        )}
        <input
          type="text"
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ''}
          aria-label="Ask the resume assistant"
          className="relative z-10 w-full min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
      </div>

      {messageCount > 0 && (
        <span className="shrink-0 rounded-md border border-line bg-bg px-2 py-1 text-xs text-text-secondary">
          {messageCount} message{messageCount === 1 ? '' : 's'}
        </span>
      )}

      <button
        type="submit"
        disabled={disabled || text.trim().length === 0}
        aria-label="Send"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-accent-light transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <SendIcon className="h-4 w-4" />
      </button>
    </form>
  )
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.8 4.6L18.4 9.4 13.8 11.2 12 15.8 10.2 11.2 5.6 9.4 10.2 7.6 12 3z"
        fill="currentColor"
      />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12l16-8-6 16-2.5-6.5L4 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
