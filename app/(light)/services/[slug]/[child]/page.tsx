import { notFound } from "next/navigation"

import { ServiceDocument } from "@/components/sections/ServiceDocument"
import { services } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

export const ensureStatic = "navigation"

function nestedServices() {
  return services.flatMap((service) => {
    if (!service.parent || service.path === null) {
      return []
    }

    const parent = services.find((item) => item.slug === service.parent)
    if (!parent) {
      return []
    }

    return [{ service: { ...service, path: service.path }, parent }]
  })
}

export function generateStaticParams() {
  return nestedServices().map(({ service }) => ({
    slug: service.parent,
    child: service.slug,
  }))
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]/[child]">) {
  const { slug: parentSlug, child } = await params
  const match = nestedServices().find(
    (item) => item.service.slug === child && item.parent.slug === parentSlug,
  )
  if (!match) {
    notFound()
  }

  const { service } = match
  return buildMetadata({
    title: service.title,
    absoluteTitle: service.seo.title,
    description: service.seo.description ?? service.summary,
    path: service.path,
    image: service.seo.image,
    noindex: service.seo.noindex,
  })
}

export default async function NestedServicePage({
  params,
}: PageProps<"/services/[slug]/[child]">) {
  const { slug: parentSlug, child } = await params
  const match = nestedServices().find(
    (item) => item.service.slug === child && item.parent.slug === parentSlug,
  )
  if (!match) {
    notFound()
  }

  return <ServiceDocument service={match.service} parent={match.parent} />
}
