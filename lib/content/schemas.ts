import * as z from "zod"

const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Must be a lowercase kebab-case slug",
  )

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const calendarDateSchema = z.string().refine(isCalendarDate, {
  message: "Must be a real calendar date in YYYY-MM-DD",
})

export const seoSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    image: z.string().min(1).optional(),
    noindex: z.boolean().default(false),
  })
  .prefault({})

export const authorSchema = z
  .object({
    name: z.string().min(1),
    slug: slugSchema,
    role: z.string().min(1).optional(),
    avatar: z.string().min(1).optional(),
  })
  .superRefine((author, ctx) => {
    if (!author.avatar) {
      return
    }

    const prefix = `/images/authors/${author.slug}/`
    if (!author.avatar.startsWith(prefix)) {
      ctx.addIssue({
        code: "custom",
        path: ["avatar"],
        message: `Must start with ${prefix}`,
      })
    }
  })

export const articleSchema = z
  .object({
    title: z.string().min(1),
    heading: z.string().min(1).optional(),
    slug: slugSchema,
    date: calendarDateSchema,
    updated: calendarDateSchema.optional(),
    author: slugSchema,
    category: slugSchema,
    excerpt: z.string().min(1),
    coverImage: z.object({
      src: z.string().min(1),
      alt: z.string().min(1),
    }),
    draft: z.boolean().default(false),
    seo: seoSchema,
  })
  .superRefine((article, ctx) => {
    const prefix = `/images/articles/${article.slug}/`
    if (!article.coverImage.src.startsWith(prefix)) {
      ctx.addIssue({
        code: "custom",
        path: ["coverImage", "src"],
        message: `Must start with ${prefix}`,
      })
    }
  })

export const serviceSchema = z.object({
  title: z.string().min(1),
  slug: slugSchema,
  summary: z.string().min(1),
  order: z.number().int().nonnegative(),
  parent: slugSchema.optional(),
  heading: z.string().min(1).optional(),
  layout: z.enum(["document", "landing"]).optional(),
  seo: seoSchema,
})

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: slugSchema,
  description: z.string().min(1).optional(),
  order: z.number().int().nonnegative().optional(),
  seo: seoSchema,
})

export const pageSchema = z.object({
  title: z.string().min(1),
  slug: slugSchema,
  heading: z.string().min(1).optional(),
  seo: seoSchema,
})
