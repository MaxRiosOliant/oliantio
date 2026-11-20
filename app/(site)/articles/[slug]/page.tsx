import { notFound } from "next/navigation"

import { ArticleBody } from "@/components/sections/ArticleBody"
import { ArticleCover } from "@/components/sections/ArticleCover"
import { ArticleHeader } from "@/components/sections/ArticleHeader"
import { publishedArticles } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

export const ensureStatic = "navigation"

export function generateStaticParams() {
  return publishedArticles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/articles/[slug]">) {
  const { slug } = await params
  const article = publishedArticles.find((item) => item.slug === slug)
  if (!article) {
    notFound()
  }

  return buildMetadata({
    title: article.title,
    absoluteTitle: article.seo.title,
    description: article.seo.description ?? article.excerpt,
    path: article.path,
    image: article.seo.image ?? article.coverImage.src,
    noindex: article.seo.noindex,
  })
}

export default async function ArticlePage({
  params,
}: PageProps<"/articles/[slug]">) {
  const { slug } = await params
  const article = publishedArticles.find((item) => item.slug === slug)
  if (!article) {
    notFound()
  }

  return (
    <>
      <ArticleHeader article={article} />
      <ArticleCover article={article} />
      <ArticleBody loadBody={article.loadBody} />
    </>
  )
}
