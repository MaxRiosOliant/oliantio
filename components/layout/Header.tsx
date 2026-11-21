"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { Logo } from "@/components/layout/Logo"
import { Nav } from "@/components/layout/Nav"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { primaryNav } from "@/config/navigation"
import { home } from "@/content/home"

export function Header() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const onHome = pathname === "/"
  const barClass =
    onHome && !scrolled
      ? "bg-transparent"
      : scrolled
        ? "bg-[#201e28e6] backdrop-blur-[2px]"
        : "bg-ink"

  return (
    <header className="fixed inset-x-0 top-0 z-40 text-paper">
      <div className={`relative z-20 transition-colors ${barClass}`}>
        <div className="site-container flex h-[5.125rem] items-center gap-3">
          <Logo />
          <div className="flex h-full min-w-0 flex-1 items-stretch gap-3">
            <Nav
              items={primaryNav}
              cta={{ href: home.header.ctaHref, label: home.header.cta }}
            />
            <div className="relative z-20 hidden items-center desk:flex">
              <ButtonLink href={home.header.ctaHref} variant="secondary">
                {home.header.cta}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
