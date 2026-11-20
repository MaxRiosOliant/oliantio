import { mdxComponents } from "@/components/mdx"
import { Breadcrumbs } from "@/components/sections/Breadcrumbs"
import { ContentBody } from "@/components/sections/ContentBody"
import { PageIntro } from "@/components/sections/PageIntro"
import type { services } from "@/lib/content"
import type { ServiceMeta } from "@/lib/content/records"

type LoadedService = (typeof services)[number]

type ServiceDocumentProps = {
  service: LoadedService & { path: string }
  parent?: ServiceMeta | null
}

export async function ServiceDocument({ service, parent }: ServiceDocumentProps) {
  if (service.layout === "landing") {
    const { default: Content } = await service.loadBody()
    return <Content components={mdxComponents} />
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(parent
            ? [{ label: parent.title, href: parent.path ?? undefined }]
            : []),
          { label: service.title },
        ]}
      />
      <PageIntro title={service.heading} description={service.summary} />
      <ContentBody loadBody={service.loadBody} />
    </>
  )
}
