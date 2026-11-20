import { Hero } from "@/components/sections/Hero"
import { Insights } from "@/components/sections/Insights"
import { Process } from "@/components/sections/Process"
import { ServiceGrid } from "@/components/sections/ServiceGrid"
import { WhyWorkWithUs } from "@/components/sections/WhyWorkWithUs"
import { site } from "@/config/site"
import { buildMetadata } from "@/lib/seo"

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
      <Insights />
    </>
  )
}
