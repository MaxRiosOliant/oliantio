import Link from "next/link"

export type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: readonly BreadcrumbItem[]
  className?: string
}

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none">
      <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function Breadcrumbs({ items, className = "site-container pt-10" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.875rem] leading-[1.5] tracking-[0.1em]">
        {items.map((item, index) => {
          const last = index === items.length - 1
          const home = index === 0 && item.href === "/"
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  aria-label={home ? item.label : undefined}
                  className="text-neutral-3 hover:text-ink"
                >
                  {home ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
                      <path
                        d="M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="font-medium">
                  {item.label}
                </span>
              )}
              {last ? null : <Chevron />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
