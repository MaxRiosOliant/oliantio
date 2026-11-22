"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ButtonLink } from "@/components/ui/ButtonLink"
import { contactHrefForPath } from "@/lib/forms/topics"

function resolvedHref(pathname: string, href: string) {
  return href === "/contact-us" ? contactHrefForPath(pathname) : href
}

export function SiteContactLink({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: string
}) {
  const pathname = usePathname()
  return (
    <Link href={resolvedHref(pathname, href)} className={className}>
      <span className="trim-text">{children}</span>
    </Link>
  )
}

export function SiteContactButton({ href, children }: { href: string; children: string }) {
  const pathname = usePathname()
  return (
    <ButtonLink href={resolvedHref(pathname, href)} variant="secondary" tone="onLight">
      {children}
    </ButtonLink>
  )
}
