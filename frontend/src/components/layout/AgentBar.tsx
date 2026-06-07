// Shared agent bar. Step 2 ships the presentational shell with the Design
// System styling. Wiring (focus → open drawer, send → POST /api/chat) lands in
// steps 3–4; `onActivate` is the hook the hero/sticky bar will use to open the
// chat drawer.

interface AgentBarProps {
  onActivate?: () => void
}

export function AgentBar({ onActivate }: AgentBarProps) {
  return (
    <div className="agent-bar flex w-full max-w-xl items-center gap-3 px-4 py-3">
      <SparkleIcon className="h-4 w-4 shrink-0 text-accent-light" />
      <input
        type="text"
        readOnly
        onFocus={onActivate}
        placeholder="Ask me anything about Brad's background…"
        aria-label="Ask the resume assistant"
        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
      />
      <button
        type="button"
        onClick={onActivate}
        aria-label="Send"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-accent-light transition-colors hover:bg-white/5"
      >
        <SendIcon className="h-4 w-4" />
      </button>
    </div>
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
