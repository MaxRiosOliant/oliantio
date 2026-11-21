import type { ComponentType } from "react"

import { ClosingCta } from "@/components/sections/ClosingCta"
import { CtaBand } from "@/components/sections/CtaBand"
import { FaqSection } from "@/components/sections/FaqSection"
import { PageIntro } from "@/components/sections/PageIntro"
import { ReasonColumns } from "@/components/sections/ReasonColumns"
import { ServiceCatalog } from "@/components/sections/ServiceCatalog"
import { ServiceHero } from "@/components/sections/ServiceHero"

export const mdxComponents = {
  PageIntro,
  ServiceHero,
  ServiceCatalog,
  CtaBand,
  ReasonColumns,
  FaqSection,
  ClosingCta,
}

export type MdxComponents = typeof mdxComponents

export type MdxContent = ComponentType<{
  components?: MdxComponents
}>
