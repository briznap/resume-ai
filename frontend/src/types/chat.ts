export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  /** True if this assistant bubble is a client-side error notice. */
  isError?: boolean
}

/** Wire format for a prior turn sent back to the backend for context. */
export interface ChatTurnDTO {
  role: ChatRole
  content: string
}
