import { breadcrumbs } from "@/content/breadcrumbs"
import { mdxComponents } from "@/components/mdx"
import { Breadcrumbs } from "@/components/sections/Breadcrumbs"
import { ContentBody } from "@/components/sections/ContentBody"
import { PageIntro } from "@/components/sections/PageIntro"
import { ServiceProjects } from "@/components/sections/ServiceProjects"
import type { services } from "@/lib/content"
import type { ServiceMeta } from "@/lib/content/records"

type LoadedService = (typeof services)[number]

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
    const components = {
      ...mdxComponents,
      ServiceProjects: ({ title }: { title: string }) => (
        <ServiceProjects title={title} projects={service.projects ?? []} />
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
