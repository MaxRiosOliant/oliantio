import Link from "next/link"

import type { ServiceMeta } from "@/lib/content/records"

export type ServiceProject = NonNullable<ServiceMeta["projects"]>[number]

type ServiceProjectsProps = {
  title: string
  projects?: readonly ServiceProject[]
}

export function ServiceProjects({ title, projects = [] }: ServiceProjectsProps) {
  if (projects.length === 0) {
    return null
  }

  return (
    <section className="bg-paper py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-ink">
      <div className="site-container">
        <h2 className="trim-text text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
          {title}
        </h2>
        <ul className="mt-[clamp(2.5rem,2.071429rem+2.142857vw,4rem)] flex list-none flex-col gap-8">
          {projects.map((project) => (
            <li key={project.href ?? project.title}>
              <h3 className="trim-text mb-3 text-xl leading-[1.1] font-extrabold text-balance">
                <ProjectTitle project={project} />
              </h3>
              <p className="trim-text max-w-[60ch] text-base leading-6">{project.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ProjectTitle({ project }: { project: ServiceProject }) {
  if (!project.href) {
    return project.title
  }

  if (project.href.startsWith("http")) {
    return (
      <a href={project.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
        {project.title}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link href={project.href} className="hover:underline">
      {project.title}
    </Link>
  )
}
