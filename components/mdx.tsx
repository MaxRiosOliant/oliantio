import type { ComponentType } from "react"

import { CenteredIntro } from "@/components/sections/CenteredIntro"
import { ClosingCta } from "@/components/sections/ClosingCta"
import { CtaBand } from "@/components/sections/CtaBand"
import { FaqSection } from "@/components/sections/FaqSection"
import { OfficeCards } from "@/components/sections/OfficeCards"
import { PageHero } from "@/components/sections/PageHero"
import { PageIntro } from "@/components/sections/PageIntro"
import { ProseSection } from "@/components/sections/ProseSection"
import { ReasonColumns } from "@/components/sections/ReasonColumns"
import { ScheduleForm } from "@/components/sections/ScheduleForm"
import { ServiceCatalog } from "@/components/sections/ServiceCatalog"
import { ServiceHero } from "@/components/sections/ServiceHero"
import { ServiceProjects } from "@/components/sections/ServiceProjects"
import { StandaloneForm } from "@/components/sections/StandaloneForm"

export const mdxComponents = {
  PageIntro,
  PageHero,
  CenteredIntro,
  OfficeCards,
  ScheduleForm,
  ProseSection,
  StandaloneForm,
  ServiceHero,
  ServiceCatalog,
  ServiceProjects,
  CtaBand,
  ReasonColumns,
  FaqSection,
  ClosingCta,
}

export type MdxComponents = typeof mdxComponents

export type MdxContent = ComponentType<{
  components?: MdxComponents
}>
