import type { ReactNode } from "react"

import { Footer, type FooterTheme } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

export function SiteShell({ children, footerTheme }: { children: ReactNode; footerTheme?: FooterTheme }) {
  return (
    <>
      <a
        href="#main"
        className="absolute left-4 top-4 z-50 -translate-y-24 rounded-2xl bg-paper px-3 py-2 text-ink focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="flex-1 pt-[5.125rem] outline-none has-[.dark-hero]:pt-0 has-[.service-hero]:pt-0"
      >
        {children}
      </main>
      <Footer theme={footerTheme} />
    </>
  )
}
