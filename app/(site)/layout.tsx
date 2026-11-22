import { SiteShell } from "@/components/layout/SiteShell"

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteShell headerMode="transparent" footerSpace="none">
      {children}
    </SiteShell>
  )
}
