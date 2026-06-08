import ReactMarkdown, { type Components } from 'react-markdown'
import type { ChatMessage } from '../../types/chat'

// Markdown element styling tuned for the compact chat drawer. Tailwind's
// preflight strips default element styles, so each tag is styled explicitly.
// No headers are styled aggressively — the system prompt is told to avoid them.
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-accent-light underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[13px]">{children}</code>
  ),
}

// A single chat bubble. User messages sit right-aligned in indigo; assistant
// messages left-aligned on the surface color. Assistant replies render through
// ReactMarkdown; user messages and error notices stay plain text.
export function AgentMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const renderMarkdown = !isUser && !message.isError

  const bubbleClass = isUser
    ? 'bg-accent text-white'
    : message.isError
      ? 'bg-surface text-red-300 border border-red-500/30'
      : 'bg-surface text-text-primary border border-line'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${bubbleClass}`}
      >
        {renderMarkdown ? (
          <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
        ) : (
          <span className="whitespace-pre-wrap">{message.content}</span>
        )}
      </div>
    </div>
  )
}
