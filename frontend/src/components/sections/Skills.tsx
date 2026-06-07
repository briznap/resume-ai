import { useResume } from '../../hooks/useResume'
import { Card } from '../ui/Card'
import { SectionHeader } from '../ui/SectionHeader'

export function Skills() {
  const { data } = useResume()
  if (!data) return null

  return (
    <section id="skills" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-16">
      <SectionHeader>Skills</SectionHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.skills.map((category) => (
          // All cards share the same border (from Card). The featured flag only
          // affects the title color: bright for featured, muted otherwise.
          <Card key={category.id}>
            <h3
              className={`text-sm font-medium ${
                category.featured ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {category.category}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {category.items.map((item) => (
                // Chips sit slightly lighter than the card surface (white/5
                // overlay) with brighter text, so they read as distinct.
                <span
                  key={item}
                  className="rounded-md border border-line-strong bg-white/5 px-2 py-1 text-xs text-text-primary"
                >
                  {item}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
