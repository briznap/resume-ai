import { useOutletContext } from 'react-router-dom'
import { StickyAgentBar } from '../components/layout/StickyAgentBar'
import type { AppOutletContext } from '../App'

const OPENER = 'I have always been fascinated by technology.'

const BIO = `I built my first PC from scavenged parts when I was 10 years old, compiling Linux drivers by hand and reading borrowed textbooks to learn enough commands to connect a dialup modem to the internet. From the first screech of the modem tone, I was hooked. I have been learning, tinkering, and building ever since, and my curiosity and love of technology continues to grow. These days, when I'm not working on my homelab or setting up another Minecraft server, I am usually making something spicy in the kitchen, roasting coffee, or brewing a batch of beer. Out of the house, you'll find me biking with my kids, walking nature trails, or getting into the woods for some camping. I live in St. Paul, Minnesota with my wife and three boys. Life is an adventure.`

const CHIPS = [
  '📍 St. Paul, Minnesota',
  '☕ Coffee roasting',
  '🍺 Homebrewing',
  '🏕️ Camping',
  '🖥️ Homelab',
]

export default function AboutPage() {
  const chat = useOutletContext<AppOutletContext>()

  return (
    <>
      <main className="pb-20">
        {/* Hero — same visual language / type size as the main page hero */}
        <section className="flex flex-col items-center px-6 pb-10 pt-24 text-center">
          <h1 className="text-[32px] font-medium leading-tight tracking-[-0.03em] text-text-primary md:text-[42px]">
            Brad Belnap
          </h1>
          <p className="mt-3 text-base text-text-secondary">The person behind the resume</p>
        </section>

        <div className="section-separator" />

        {/* Bio — narrower reading column */}
        <section className="mx-auto max-w-2xl px-6 py-12">
          <p className="text-lg leading-relaxed text-text-primary">{OPENER}</p>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">{BIO}</p>

          {/* Detail chips — same tag style as skill/stack pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-md border border-line bg-bg px-2.5 py-1 text-sm text-text-secondary"
              >
                {chip}
              </span>
            ))}
          </div>
        </section>
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
