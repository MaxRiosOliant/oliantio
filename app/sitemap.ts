import type { MetadataRoute } from "next"

import { sitemapPaths } from "@/lib/content"
import { absoluteUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapPaths.map((path) => ({
    url: absoluteUrl(path),
  }))
}
