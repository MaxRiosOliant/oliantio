import Link from "next/link"

type RelatedLinksProps = {
  title: string
  links: ReadonlyArray<{ title: string; href: string }>
  tone: "violet" | "lime"
}

const tones = {
  violet: {
    frame: "bg-[linear-gradient(90deg,#d4a5ff,#45ab34)]",
    head: "bg-[linear-gradient(90deg,#d4a5ff,#45ab34)]",
  },
  lime: {
    frame: "bg-[linear-gradient(90deg,#9fc418,#45ab34)]",
    head: "bg-[linear-gradient(90deg,#9fc418,#45ab34)]",
  },
}

export function RelatedLinks({ title, links, tone }: RelatedLinksProps) {
  if (links.length === 0) {
    return null
  }

  return (
    <nav aria-label={title} className={`rounded-[0.75rem] p-0.5 ${tones[tone].frame}`}>
      <div className="overflow-hidden rounded-[0.65rem] bg-white">
        <p className={`py-2 text-center text-[1.25rem] leading-[1.5] font-semibold text-paper ${tones[tone].head}`}>
          {title}
        </p>
        <ul>
          {links.map((link) => (
            <li
              key={link.href}
              className="border-t border-black/20 bg-[linear-gradient(#e6f2e3,#fff)] px-6 py-3 first:border-t-0"
            >
              {link.href.startsWith("http") ? (
                <a href={link.href} className="text-[0.875rem] leading-[1.5] tracking-[0.02em] hover:underline">
                  {link.title}
                </a>
              ) : (
                <Link href={link.href} className="text-[0.875rem] leading-[1.5] tracking-[0.02em] hover:underline">
                  {link.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
