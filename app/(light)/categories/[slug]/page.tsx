import { notFound } from "next/navigation"

import { blog } from "@/content/blog"
import { ArticleGrid } from "@/components/sections/ArticleGrid"
import { Breadcrumbs } from "@/components/sections/Breadcrumbs"
import { CategoryChips } from "@/components/sections/CategoryChips"
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
      <CategoryChips categories={categories} activeSlug={category.slug} />
      <Breadcrumbs
        className="site-container pt-[var(--size-4rem)] pb-[var(--size-4rem)]"
        items={[
          { label: blog.homeLabel, href: "/" },
          { label: blog.breadcrumb, href: "/blog" },
          { label: category.name },
        ]}
      />
      <ArticleGrid title={category.name} articles={articles} />
    </>
  )
}
