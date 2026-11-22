import { SiteShell } from "@/components/layout/SiteShell"

export default function ServicesLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteShell footerTheme="light" footerSpace="small">
      {children}
    </SiteShell>
  )
}
