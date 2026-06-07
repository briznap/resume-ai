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
          // Featured categories get an indigo ring + brighter label. (Ring is
          // used instead of a border-color override to avoid clashing with the
          // Card's baked border, and because Tailwind /opacity doesn't work on
          // our CSS-var colors.)
          <Card
            key={category.id}
            className={category.featured ? 'ring-1 ring-[rgba(99,102,241,0.4)]' : ''}
          >
            <h3
              className={`text-sm font-medium ${
                category.featured ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {category.category}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {category.items.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-line bg-bg px-2 py-1 text-xs text-text-secondary"
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
