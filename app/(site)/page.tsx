import { Hero } from "@/components/sections/Hero"
import { Insights } from "@/components/sections/Insights"
import { Process } from "@/components/sections/Process"
import { ServiceGrid } from "@/components/sections/ServiceGrid"
import { WhyWorkWithUs } from "@/components/sections/WhyWorkWithUs"
import { site } from "@/config/site"
import { publishedArticles } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

const newestArticles = [...publishedArticles]
  .sort((a, b) => {
    if (a.date === b.date) {
      return a.slug < b.slug ? -1 : 1
    }

    return a.date < b.date ? 1 : -1
  })
  .slice(0, 3)

export const metadata = buildMetadata({
  title: "Home",
  absoluteTitle:
    "Software Development and Team Augmentation in Europe and LATAM | OLIANT",
  description: site.description,
  path: "/",
})

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServiceGrid />
      <WhyWorkWithUs />
      <Process />
      <Insights articles={newestArticles} />
    </>
  )
}
