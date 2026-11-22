import { breadcrumbs } from "@/content/breadcrumbs"
import { mdxComponents } from "@/components/mdx"
import { Breadcrumbs } from "@/components/sections/Breadcrumbs"
import { ContentBody } from "@/components/sections/ContentBody"
import { PageIntro } from "@/components/sections/PageIntro"
import { ServiceProjects } from "@/components/sections/ServiceProjects"
import { projects, type services } from "@/lib/content"
import type { ServiceMeta } from "@/lib/content/records"

type LoadedService = (typeof services)[number]

const projectsBySlug = new Map(projects.map((project) => [project.slug, project]))

function projectsFor(service: LoadedService) {
  return service.projects.map((slug) => {
    const project = projectsBySlug.get(slug)
    if (!project) {
      throw new Error(
        `Service "${service.slug}" references missing project "${slug}"`,
      )
    }
    return project
  })
}

type ServiceDocumentProps = {
  service: LoadedService & { path: string }
  parent?: ServiceMeta | null
}

export async function ServiceDocument({ service, parent }: ServiceDocumentProps) {
  const trail = (
    <Breadcrumbs
      className="site-container pt-6"
      path={service.path}
      items={[
        { label: breadcrumbs.home, href: "/" },
        { label: breadcrumbs.services },
        ...(parent ? [{ label: parent.title, href: parent.path ?? undefined }] : []),
        { label: service.title },
      ]}
    />
  )

  if (service.layout === "landing") {
    const { default: Content } = await service.loadBody()
    const referenced = projectsFor(service)
    const components = {
      ...mdxComponents,
      ServiceProjects: () => (
        <ServiceProjects title={service.projectsHeading} projects={referenced} />
      ),
    }
    return (
      <>
        {trail}
        <Content components={components} />
      </>
    )
  }

  return (
    <>
      {trail}
      <PageIntro title={service.heading} description={service.summary} />
      <ContentBody loadBody={service.loadBody} />
    </>
  )
}
