import type * as z from "zod"

import type {
  articleSchema,
  authorSchema,
  categorySchema,
  pageSchema,
  serviceSchema,
} from "@/lib/content/schemas"

export type AuthorMeta = z.output<typeof authorSchema>

export type CategoryMeta = z.output<typeof categorySchema> & {
  path: string
}

export type ArticleMeta = Omit<
  z.output<typeof articleSchema>,
  "author" | "category" | "heading"
> & {
  author: AuthorMeta
  category: CategoryMeta
  heading: string
  path: string
}

export type ServiceMeta = Omit<z.output<typeof serviceSchema>, "heading"> & {
  heading: string
  path: string | null
}

export type PageMeta = Omit<z.output<typeof pageSchema>, "heading"> & {
  heading: string
  path: string
  // Body opens with <PageHero>, whose dark background sits behind the header.
  darkHero: boolean
}
