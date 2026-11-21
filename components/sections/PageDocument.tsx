import { mdxComponents } from "@/components/mdx"
import { Breadcrumbs } from "@/components/sections/Breadcrumbs"
import { ContentBody } from "@/components/sections/ContentBody"
import { PageIntro } from "@/components/sections/PageIntro"
import type { pages } from "@/lib/content"

type PageDocumentProps = {
  page: (typeof pages)[number]
}

export async function PageDocument({ page }: PageDocumentProps) {
  if (page.layout === "landing" || page.layout === "standalone") {
    const { default: Content } = await page.loadBody()
    return <Content components={mdxComponents} />
  }

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: page.title }]}
      />
      <PageIntro title={page.heading} />
      <ContentBody loadBody={page.loadBody} />
    </>
  )
}
