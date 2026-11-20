import type { MdxContent } from "@/components/mdx"

import {
  articleBodies,
  authorBodies,
  pageBodies,
  serviceBodies,
} from "@/lib/content/generated/loaders"
import {
  articleMeta,
  authorMeta,
  categoryMeta,
  pageMeta,
  serviceMeta,
} from "@/lib/content/generated/meta"

type BodyLoader = () => Promise<{ default: MdxContent }>

function withBodies<T extends { slug: string }>(
  items: readonly T[],
  bodies: Record<string, BodyLoader>,
) {
  return items.map((item) => {
    const loadBody = bodies[item.slug]
    if (!loadBody) {
      throw new Error(`Missing content body for "${item.slug}"`)
    }

    return { ...item, loadBody }
  })
}

export const articles = withBodies(articleMeta, articleBodies)
export const publishedArticles = articles.filter((article) => !article.draft)
export const draftArticles = articles.filter((article) => article.draft)

export const authors = withBodies(authorMeta, authorBodies)
export const categories = categoryMeta
export const services = withBodies(serviceMeta, serviceBodies)
export const pages = withBodies(pageMeta, pageBodies)

export const publishedPaths = [
  ...publishedArticles.map((item) => item.path),
  ...categories.map((item) => item.path),
  ...services.flatMap((item) => (item.path ? [item.path] : [])),
  ...pages.map((item) => item.path),
]

export const sitemapPaths = [
  "/",
  "/blog",
  ...publishedArticles
    .filter((item) => !item.seo.noindex)
    .map((item) => item.path),
  ...categories.filter((item) => !item.seo.noindex).map((item) => item.path),
  ...services.flatMap((item) =>
    item.path && !item.seo.noindex ? [item.path] : [],
  ),
  ...pages.filter((item) => !item.seo.noindex).map((item) => item.path),
]
