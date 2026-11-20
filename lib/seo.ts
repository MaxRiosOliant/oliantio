import type { Metadata } from "next"

import { site } from "@/config/site"

type MetadataInput = {
  title: string
  description: string
  path: string
  image?: string
  absoluteTitle?: string
  noindex?: boolean
}

export function absoluteUrl(path: string) {
  const base = site.url.replace(/\/+$/, "")
  if (path === "/" || path === "") {
    return base
  }

  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized.replace(/\/+$/, "")}`
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  absoluteTitle,
  noindex = false,
}: MetadataInput): Metadata {
  const socialTitle = absoluteTitle ?? `${title} | ${site.name}`

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: site.name,
      locale: site.locale,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: socialTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
