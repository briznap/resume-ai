import { AnimatePresence, motion } from 'framer-motion'
import { AgentBar } from './AgentBar'

interface StickyAgentBarProps {
  visible: boolean
  onSubmit: (text: string) => void
  /** Opens the drawer to view existing conversation history. */
  onOpen?: () => void
  /** Conversation length, surfaced as a subtle pill when > 0. */
  messageCount?: number
}

// Sticky bottom agent bar, fading in/out (~150ms). Visibility is decided by the
// page: on the home page it appears once the hero bar scrolls away; on other
// routes (which have no hero bar) it's shown whenever the drawer is closed.
export function StickyAgentBar({ visible, onSubmit, onOpen, messageCount }: StickyAgentBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4"
        >
          <div className="pointer-events-auto flex w-full justify-center">
            <AgentBar onSubmit={onSubmit} onOpen={onOpen} messageCount={messageCount} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
