import { SiteShell } from "@/components/layout/SiteShell"

export default function LightFooterLayout({ children }: LayoutProps<"/">) {
  return <SiteShell footerTheme="light">{children}</SiteShell>
}
