import { notFound } from "next/navigation"

import { ArticleList } from "@/components/sections/ArticleList"
import { PageIntro } from "@/components/sections/PageIntro"
import { categories, publishedArticles } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

export const ensureStatic = "navigation"

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params
  const category = categories.find((item) => item.slug === slug)
  if (!category) {
    notFound()
  }

  return buildMetadata({
    title: category.name,
    absoluteTitle: category.seo.title,
    description: category.seo.description ?? category.description ?? category.name,
    path: category.path,
    image: category.seo.image,
    noindex: category.seo.noindex,
  })
}

export default async function CategoryPage({
  params,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params
  const category = categories.find((item) => item.slug === slug)
  if (!category) {
    notFound()
  }

  const articles = publishedArticles.filter(
    (article) => article.category.slug === category.slug,
  )

  return (
    <>
      <PageIntro title={category.name} description={category.description} />
      <ArticleList articles={articles} />
    </>
  )
}
