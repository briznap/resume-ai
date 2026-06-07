import { useState } from 'react'

// Shared agent input bar. Used in three places — centered in the hero, as the
// sticky bottom bar, and as the input inside the chat drawer — all driving the
// same conversation. Styling comes from the `.agent-bar` class (Design System).

interface AgentBarProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  autoFocus?: boolean
  placeholder?: string
  /** If provided, the sparkle icon becomes a button that opens the drawer. */
  onOpen?: () => void
  /** When > 0, a subtle pill shows the conversation length. */
  messageCount?: number
}

export function AgentBar({
  onSubmit,
  disabled = false,
  autoFocus = false,
  placeholder = "Ask me anything about Brad's background…",
  onOpen,
  messageCount = 0,
}: AgentBarProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSubmit(text)
    setValue('')
  }

  return (
    <form
      className="agent-bar flex min-h-[48px] w-full max-w-xl items-center gap-3 px-4 py-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {/* Left side: opens the conversation drawer when onOpen is provided
          (sticky bar), otherwise a plain decorative icon (hero / drawer input). */}
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open conversation"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-accent-light transition-colors hover:bg-white/5"
        >
          <SparkleIcon className="h-5 w-5" />
        </button>
      ) : (
        <SparkleIcon className="h-5 w-5 shrink-0 text-accent-light" />
      )}

      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Ask the resume assistant"
        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
      />

      {messageCount > 0 && (
        <span className="shrink-0 rounded-md border border-line bg-bg px-2 py-1 text-xs text-text-secondary">
          {messageCount} message{messageCount === 1 ? '' : 's'}
        </span>
      )}

      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
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
