import { notFound } from "next/navigation"

import { ServiceDocument } from "@/components/sections/ServiceDocument"
import { services } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

export const ensureStatic = "navigation"

function oneLevelServices() {
  return services.filter(
    (service): service is (typeof services)[number] & { path: string } =>
      !service.parent && service.path !== null,
  )
}

export function generateStaticParams() {
  return oneLevelServices().map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params
  const service = oneLevelServices().find((item) => item.slug === slug)
  if (!service) {
    notFound()
  }

  return buildMetadata({
    title: service.title,
    absoluteTitle: service.seo.title,
    description: service.seo.description ?? service.summary,
    path: service.path,
    image: service.seo.image,
    noindex: service.seo.noindex,
  })
}

export default async function ServicePage({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params
  const service = oneLevelServices().find((item) => item.slug === slug)
  if (!service) {
    notFound()
  }

  return <ServiceDocument service={service} />
}
