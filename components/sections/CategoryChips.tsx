import Link from "next/link"

import type { CategoryMeta } from "@/lib/content/records"

type CategoryChipsProps = {
  categories: readonly CategoryMeta[]
  activeSlug?: string
}

export function CategoryChips({ categories, activeSlug }: CategoryChipsProps) {
  return (
    <nav aria-label="Blog categories" className="site-container pt-[var(--size-3rem)]">
      <ul className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const active = category.slug === activeSlug
          return (
            <li key={category.slug}>
              <Link
                href={category.path}
                aria-current={active ? "page" : undefined}
                className={`inline-block rounded-[0.5rem] p-px ${active ? "bg-ink" : "bg-[linear-gradient(90deg,#d4a5ff,#45ab34)]"}`}
              >
                <span className="block rounded-[0.4375rem] bg-white px-2 py-0.5 text-[0.875rem] leading-[1.5] text-ink hover:bg-neutral-1">
                  {category.name}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
