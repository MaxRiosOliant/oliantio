import { notFound } from "next/navigation"

import { PageDocument } from "@/components/sections/PageDocument"
import { pages } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

export const ensureStatic = "navigation"

export function generateStaticParams() {
  return pages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: PageProps<"/[slug]">) {
  const { slug } = await params
  const page = pages.find((item) => item.slug === slug)
  if (!page) {
    notFound()
  }

  return buildMetadata({
    title: page.title,
    absoluteTitle: page.seo.title,
    description: page.seo.description ?? page.heading,
    path: page.path,
    image: page.seo.image,
    noindex: page.seo.noindex,
  })
}

export default async function ContentPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params
  const page = pages.find((item) => item.slug === slug)
  if (!page) {
    notFound()
  }

  return <PageDocument page={page} />
}
