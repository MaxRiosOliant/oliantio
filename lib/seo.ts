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

// Trail items without an href have no page, so they are left out of the list;
// the last item is the current page.
export function breadcrumbJsonLd(
  items: ReadonlyArray<{ label: string; href?: string }>,
  currentPath: string,
) {
  const entries = items.flatMap((item, index) => {
    const href = index === items.length - 1 ? currentPath : item.href
    return href ? [{ name: item.label, url: absoluteUrl(href) }] : []
  })

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.url,
    })),
  }
}

export function faqJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/images/home/logo.png"),
    sameAs: [
      site.social.facebook,
      site.social.instagram,
      site.social.linkedin,
      site.social.x,
      site.social.youtube,
    ],
  }
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
  const socialImage = image ?? "/opengraph-image.png"

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
      images: [
        image
          ? { url: image }
          : {
              url: socialImage,
              width: 1200,
              height: 630,
              alt: site.name,
            },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
    },
  }
}
