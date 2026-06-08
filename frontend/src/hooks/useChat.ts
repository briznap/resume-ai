import { useCallback, useState } from 'react'
import { ChatError, sendChat } from '../lib/api'
import type { ChatMessage } from '../types/chat'

let idCounter = 0
const nextId = () => `m${idCounter++}`

export interface UseChatResult {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  open: () => void
  close: () => void
  send: (text: string) => void
}

/**
 * Single source of truth for the chat conversation. Lives at the App level so
 * the hero bar, sticky bottom bar, and drawer all drive the same conversation.
 *
 * `onUnauthorized` fires if a chat request returns 401 (session expired) so the
 * caller can re-show the auth gate.
 */
export function useChat(onUnauthorized?: () => void): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      setIsOpen(true)
      const userMessage: ChatMessage = { id: nextId(), role: 'user', content: trimmed }
      // History = everything before this new message (current state value).
      const history = messages.map(({ role, content }) => ({ role, content }))
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      sendChat(trimmed, history)
        .then((reply) => {
          setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: reply }])
        })
        .catch((err) => {
          // Session expired — let the app re-show the auth gate, no error bubble.
          if (err instanceof ChatError && err.status === 401) {
            onUnauthorized?.()
            return
          }
          const content =
            err instanceof ChatError
              ? err.message
              : 'Something went wrong. Please try again.'
          setMessages((prev) => [
            ...prev,
            { id: nextId(), role: 'assistant', content, isError: true },
          ])
        })
        .finally(() => setIsLoading(false))
    },
    [messages, isLoading, onUnauthorized],
  )

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return { messages, isOpen, isLoading, open, close, send }
}
