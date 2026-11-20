"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"

import type { NavGroup, NavItem, NavLink } from "@/config/navigation"
import { ButtonLink } from "@/components/ui/ButtonLink"

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
  if (!item.href) {
    return <span className={className}>{item.label}</span>
  }

  if (isExternal(item.href)) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
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
      href={item.href}
      aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
      onClick={onNavigate}
      className={className}
    >
      {item.label}
    </Link>
  )
}

function GroupColumn({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup
  pathname: string
  onNavigate: () => void
}) {
  return (
    <div className="min-w-56">
      <NavAnchor
        item={group}
        pathname={pathname}
        onNavigate={onNavigate}
        className="block px-3 py-2 text-base font-semibold text-brand-5"
      />
      {group.links.length ? (
        <ul>
          {group.links.map((link) => (
            <li key={menuKey(link)}>
              <NavAnchor
                item={link}
                pathname={pathname}
                onNavigate={onNavigate}
                className="block rounded-lg px-3 py-2 text-ink hover:bg-neutral-1 aria-[current=page]:font-semibold"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
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
            className="block px-4 py-2 text-base font-semibold text-brand"
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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      aria-hidden="true"
      className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
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
    "inline-flex items-center gap-1.5 py-4 text-base text-paper aria-[current=page]:font-semibold"

  return (
    <nav aria-label="Primary" className="h-full min-w-0">
      <ul className="hidden h-full items-center gap-7 desk:flex">
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
                  className="absolute inset-x-0 top-full z-30"
                >
                  <div className="flex justify-end">
                    <div className="flex max-w-full flex-wrap justify-end gap-x-8 gap-y-6 rounded-b-2xl bg-paper px-8 py-6 text-ink shadow-lg">
                      {groups.map((group) => (
                        <GroupColumn
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
        className="inline-flex size-10 flex-col items-center justify-center gap-1.5 desk:hidden"
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
