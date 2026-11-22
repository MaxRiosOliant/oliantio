"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"

import type { NavGroup, NavItem, NavLink } from "@/config/navigation"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { site } from "@/config/site"

type NavProps = {
  items: readonly NavItem[]
  cta?: { href: string; label: string }
}

function isCurrent(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function destination(href: string | undefined) {
  if (!href || href === "#") {
    return undefined
  }

  return href
}

function plainClassName(className: string) {
  return className
    .split(/\s+/)
    .filter((token) => token && !token.startsWith("hover:") && !token.startsWith("aria-"))
    .join(" ")
}

function menuKey(item: { href?: string; label: string }) {
  return `${item.href ?? "group"}::${item.label}`
}

function isExternal(href: string) {
  return href.startsWith("http")
}

function NavAnchor({
  item,
  pathname,
  onNavigate,
  className,
}: {
  item: NavLink | NavGroup | NavItem
  pathname: string
  onNavigate: () => void
  className: string
}) {
  const href = destination(item.href)

  if (!href) {
    const Tag = "links" in item ? "p" : "span"
    return <Tag className={plainClassName(className)}>{item.label}</Tag>
  }

  if (isExternal(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-track={href === site.careersUrl ? "careers-click" : undefined}
        onClick={onNavigate}
        className={className}
      >
        {item.label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link
      href={href}
      aria-current={isCurrent(pathname, href) ? "page" : undefined}
      onClick={onNavigate}
      className={className}
    >
      {item.label}
    </Link>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 47 24"
      aria-hidden="true"
      className={`w-4 shrink-0 transition-transform ${open ? "-rotate-180" : ""}`}
    >
      <path
        d="M1 1L23.5 23L46 1"
        fill="none"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function MegaColumn({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup
  pathname: string
  onNavigate: () => void
}) {
  return (
    <ul>
      <li>
        <NavAnchor
          item={group}
          pathname={pathname}
          onNavigate={onNavigate}
          className="nav-mega-item is-green"
        />
      </li>
      {group.links.map((link) => (
        <li key={menuKey(link)}>
          <NavAnchor
            item={link}
            pathname={pathname}
            onNavigate={onNavigate}
            className="nav-mega-item"
          />
        </li>
      ))}
    </ul>
  )
}

function MobileGroups({
  groups,
  pathname,
  onNavigate,
}: {
  groups: readonly NavGroup[]
  pathname: string
  onNavigate: () => void
}) {
  return (
    <ul className="flex flex-col pb-2">
      {groups.map((group) => (
        <li key={menuKey(group)}>
          <NavAnchor
            item={group}
            pathname={pathname}
            onNavigate={onNavigate}
            className="block px-4 py-2 text-[1.25rem] font-semibold text-[#87bd1f]"
          />
          {group.links.length ? (
            <ul>
              {group.links.map((link) => (
                <li key={menuKey(link)}>
                  <NavAnchor
                    item={link}
                    pathname={pathname}
                    onNavigate={onNavigate}
                    className="block py-2 pr-4 pl-8 text-base text-paper hover:bg-paper/10 aria-[current=page]:font-semibold"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function Nav({ items, cta }: NavProps) {
  const pathname = usePathname()
  const mobileId = useId()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const disclosureRefs = useRef(new Map<string, HTMLButtonElement>())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [renderedPath, setRenderedPath] = useState(pathname)

  if (renderedPath !== pathname) {
    setRenderedPath(pathname)
    setMobileOpen(false)
    setOpenMenu(null)
  }

  function closeMenus() {
    setMobileOpen(false)
    setOpenMenu(null)
  }

  useEffect(() => {
    if (!mobileOpen && openMenu === null) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return
      }

      if (mobileOpen) {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }

      if (openMenu !== null) {
        const key = openMenu
        setOpenMenu(null)
        if (!mobileOpen) {
          disclosureRefs.current.get(key)?.focus()
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mobileOpen, openMenu])

  const linkClass =
    "relative z-20 inline-flex h-full items-center gap-2 px-[calc(var(--size-2rem)/2)] text-base whitespace-nowrap text-paper hover:text-[#9fc418] aria-[current=page]:font-semibold"

  return (
    <nav aria-label="Primary" className="flex h-full min-w-0 flex-1 items-center">
      <ul className="hidden h-full min-w-0 flex-1 items-stretch justify-center desk:flex">
        {items.map((item) => {
          const key = menuKey(item)
          const groups = item.groups ?? []
          const hasGroups = groups.length > 0
          const isOpen = openMenu === key
          const panelId = `${mobileId}-${key}`

          return (
            <li
              key={key}
              className="flex h-full items-center"
              onMouseEnter={() => {
                if (
                  hasGroups &&
                  window.matchMedia("(hover: hover) and (min-width: 73rem)").matches
                ) {
                  setOpenMenu(key)
                }
              }}
              onMouseLeave={() => {
                if (window.matchMedia("(hover: hover) and (min-width: 73rem)").matches) {
                  setOpenMenu((current) => (current === key ? null : current))
                }
              }}
            >
              {hasGroups ? (
                <button
                  type="button"
                  ref={(node) => {
                    if (node) {
                      disclosureRefs.current.set(key, node)
                    } else {
                      disclosureRefs.current.delete(key)
                    }
                  }}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenMenu(isOpen ? null : key)}
                  className={linkClass}
                >
                  {item.label}
                  <Chevron open={isOpen} />
                </button>
              ) : (
                <NavAnchor
                  item={item}
                  pathname={pathname}
                  onNavigate={closeMenus}
                  className={linkClass}
                />
              )}
              {hasGroups ? (
                <div
                  id={panelId}
                  hidden={!isOpen}
                  className="fixed inset-x-0 top-0 z-0 bg-[#201e28] pt-[5.125rem] text-paper"
                >
                  <div className="site-container pt-[var(--size-3rem)] pb-[var(--size-4rem)]">
                    <div className="nav-mega grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-4 gap-y-[var(--size-2rem)]">
                      {groups.map((group) => (
                        <MegaColumn
                          key={menuKey(group)}
                          group={group}
                          pathname={pathname}
                          onNavigate={closeMenus}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <button
        ref={menuButtonRef}
        type="button"
        className="relative z-10 ml-auto inline-flex size-10 flex-col items-center justify-center gap-1.5 desk:hidden"
        aria-expanded={mobileOpen}
        aria-controls={mobileId}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
        <span
          aria-hidden="true"
          className={`block h-0.5 w-6 bg-current transition ${mobileOpen ? "translate-y-1 rotate-45" : ""}`}
        />
        <span
          aria-hidden="true"
          className={`block h-0.5 w-6 bg-current transition ${mobileOpen ? "-translate-y-1 -rotate-45" : ""}`}
        />
      </button>

      <div
        id={mobileId}
        hidden={!mobileOpen}
        className="fixed inset-x-0 top-[5.125rem] z-30 max-h-[calc(100vh-5.125rem)] overflow-auto bg-ink desk:hidden"
      >
        <ul className="flex flex-col py-2">
          {items.map((item) => {
            const key = menuKey(item)
            const groups = item.groups ?? []

            return (
              <li key={key}>
                {groups.length ? (
                  <>
                    <div className="px-4 py-3 text-base font-semibold text-paper">{item.label}</div>
                    <MobileGroups
                      groups={groups}
                      pathname={pathname}
                      onNavigate={closeMenus}
                    />
                  </>
                ) : (
                  <NavAnchor
                    item={item}
                    pathname={pathname}
                    onNavigate={closeMenus}
                    className="block px-4 py-3 text-base text-paper hover:bg-paper/10 aria-[current=page]:font-semibold"
                  />
                )}
              </li>
            )
          })}
        </ul>
        {cta ? (
          <div className="px-4 pb-6">
            <ButtonLink href={cta.href} variant="secondary">
              {cta.label}
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
