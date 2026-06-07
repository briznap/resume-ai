import { useResume } from '../../hooks/useResume'
import { Card } from '../ui/Card'
import { SectionHeader } from '../ui/SectionHeader'

export function Education() {
  const { data } = useResume()
  if (!data) return null

  return (
    <section id="education" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-16">
      <SectionHeader>Education</SectionHeader>
      <div className="space-y-3">
        {data.education.map((entry) => (
          <Card key={entry.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-[17px] font-medium text-text-primary">{entry.degree}</h3>
              <span className="text-sm text-text-secondary">{entry.year}</span>
            </div>
            <p className="mt-1 text-base text-text-secondary">{entry.institution}</p>
            {entry.notes && <p className="mt-2 text-base leading-relaxed text-text-tertiary">{entry.notes}</p>}
          </Card>
        ))}
      </div>
    </section>
  )
}
