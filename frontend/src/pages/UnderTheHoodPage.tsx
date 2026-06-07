import { useOutletContext } from 'react-router-dom'
import { StickyAgentBar } from '../components/layout/StickyAgentBar'
import { UnderTheHood } from '../components/sections/UnderTheHood'
import type { AppOutletContext } from '../App'

// Standalone page wrapping the architecture explorer. The nav and animated
// background come from the root layout; this page just supplies the content and
// the sticky agent bar (shown whenever the drawer is closed).
export default function UnderTheHoodPage() {
  const chat = useOutletContext<AppOutletContext>()

  return (
    <>
      <main className="pb-20 pt-6">
        <UnderTheHood />
      </main>
      <StickyAgentBar
        visible={!chat.isOpen}
        onSubmit={chat.send}
        onOpen={chat.open}
        messageCount={chat.messages.length}
      />
    </>
  )
}
