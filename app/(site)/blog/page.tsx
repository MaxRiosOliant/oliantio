import { ArticleList } from "@/components/sections/ArticleList"
import { PageIntro } from "@/components/sections/PageIntro"
import { site } from "@/config/site"
import { publishedArticles } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Blog",
  description: site.description,
  path: "/blog",
})

export default function BlogPage() {
  return (
    <>
      <PageIntro title="Blog" />
      <ArticleList articles={publishedArticles} />
    </>
  )
}
