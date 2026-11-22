import type { ReactNode } from "react"

import type { ProjectMeta } from "@/lib/content/records"

type ServiceProjectsProps = {
  title: string
  projects?: readonly ProjectMeta[]
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
            <li key={project.slug} className="rounded-2xl border-2 border-brand-5">
              <article className="p-[clamp(1.75rem,1.678571rem+0.357143vw,2rem)]">
                <p className="trim-text text-sm leading-5 font-semibold tracking-[0.08em] text-neutral-3 uppercase">
                  {project.label}
                </p>
                <h3 className="trim-text mt-3 text-[clamp(1.5rem,1.428571rem+0.357143vw,1.75rem)] leading-[1.1] font-extrabold text-balance">
                  {project.title}
                </h3>
                <div className="mt-6 grid items-start gap-8 min-[62rem]:grid-cols-[minmax(0,38rem)_minmax(18rem,1fr)] min-[62rem]:gap-x-16">
                  <ProjectBody body={project.body} />
                  <ul className="grid list-none gap-3">
                    {project.stack.map((item) => (
                      <li key={item.name} className="text-base leading-6">
                        <span className="font-bold">{item.name}.</span> {item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ProjectBody({ body }: { body: string }) {
  const paragraphs = body
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0)

  return (
    <div className="flex max-w-[65ch] flex-col gap-3">
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-base leading-6">
          {renderInline(paragraph)}
        </p>
      ))}
    </div>
  )
}

function renderInline(text: string) {
  const nodes: ReactNode[] = []
  const pattern = /\*\*([^*]+)\*\*/g
  let last = 0

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) {
      nodes.push(text.slice(last, index))
    }
    nodes.push(
      <strong key={index} className="font-bold">
        {match[1]}
      </strong>,
    )
    last = index + match[0].length
  }

  if (last < text.length) {
    nodes.push(text.slice(last))
  }

  return nodes
}
