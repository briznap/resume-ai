import { useResume } from '../../hooks/useResume'
import { Card } from '../ui/Card'
import { SectionHeader } from '../ui/SectionHeader'

export function Projects() {
  const { data } = useResume()
  if (!data) return null

  return (
    <section id="projects" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-16">
      <SectionHeader>Projects</SectionHeader>
      <div className="space-y-4">
        {data.projects.map((project) => (
          <Card key={project.id}>
            <h3 className="text-[17px] font-medium text-text-primary">{project.title}</h3>
            <p className="mt-1 text-base leading-relaxed text-text-secondary">{project.description}</p>

            {project.stack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-line bg-bg px-2 py-1 text-xs text-text-secondary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {project.bullets.length > 0 && (
              <ul className="mt-3 space-y-2">
                {project.bullets.map((bullet, i) => (
                  <li key={i} className="flex gap-2.5 text-base leading-relaxed text-text-secondary">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-text-tertiary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </section>
  )
}
