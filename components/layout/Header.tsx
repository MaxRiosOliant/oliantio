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
  const [solid, setSolid] = useState(pathname !== "/")

  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector(".home-hero")
      const covered =
        hero instanceof HTMLElement &&
        hero.getBoundingClientRect().bottom > 82
      setSolid(pathname !== "/" || !covered)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [pathname])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 text-paper transition-colors ${
        solid ? "bg-ink" : "bg-transparent"
      }`}
    >
      <div className="site-container relative flex h-[5.125rem] items-center justify-between gap-6">
        <Logo />
        <div className="flex items-center gap-6">
          <Nav
            items={primaryNav}
            cta={{ href: home.header.ctaHref, label: home.header.cta }}
          />
          <div className="hidden desk:block">
            <ButtonLink href={home.header.ctaHref} variant="secondary">
              {home.header.cta}
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  )
}
