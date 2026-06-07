import { useResume } from '../../hooks/useResume'
import { SectionHeader } from '../ui/SectionHeader'
import type { ExperienceItem } from '../../types/resume'

interface CompanyGroup {
  key: string
  company: string
  companyDescription?: string
  roles: ExperienceItem[]
}

// Group roles by companyGroup (falling back to the entry id), preserving order.
// Roles sharing a group — e.g. the CoreView roles — render under one header.
function groupByCompany(items: ExperienceItem[]): CompanyGroup[] {
  const groups = new Map<string, CompanyGroup>()
  const order: string[] = []
  for (const item of items) {
    const key = item.companyGroup ?? item.id
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        company: item.company,
        companyDescription: item.companyDescription,
        roles: [],
      })
      order.push(key)
    }
    groups.get(key)!.roles.push(item)
  }
  return order.map((k) => groups.get(k)!)
}

export function Experience() {
  const { data } = useResume()
  if (!data) return null
  const groups = groupByCompany(data.experience)

  return (
    <section id="experience" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-16">
      <SectionHeader>Experience</SectionHeader>
      <div className="space-y-10">
        {groups.map((group) => (
          <div key={group.key}>
            <h3 className="text-xl font-medium text-text-primary">{group.company}</h3>
            {group.companyDescription && (
              <p className="mt-1 text-base text-text-secondary">{group.companyDescription}</p>
            )}

            <div className="mt-4 space-y-6 border-l border-line pl-5">
              {group.roles.map((role) => (
                <div key={role.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h4 className="text-[17px] font-medium text-text-primary">{role.title}</h4>
                    <span className="text-sm text-text-secondary">{role.period.display}</span>
                  </div>
                  {role.company !== group.company && (
                    <p className="mt-0.5 text-sm text-text-tertiary">{role.company}</p>
                  )}
                  <ul className="mt-2.5 space-y-2">
                    {role.bullets.map((bullet, i) => (
                      <li key={i} className="flex gap-2.5 text-base leading-relaxed text-text-secondary">
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-text-tertiary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
