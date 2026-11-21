import Image from "next/image"
import Link from "next/link"

import type { ArticleMeta } from "@/lib/content/records"

type ArticlePagerProps = {
  previous?: ArticleMeta
  next?: ArticleMeta
  previousLabel: string
  nextLabel: string
}

function PagerCard({ label, article }: { label: string; article: ArticleMeta }) {
  return (
    <div className="flex flex-col">
      <p className="text-base leading-[1.5]">{label}</p>
      <Link href={article.path} className="group flex flex-col">
        <span className="relative block aspect-[395/200] overflow-hidden">
          <Image
            src={article.coverImage.src}
            alt=""
            fill
            sizes="(min-width: 48rem) 25rem, 100vw"
            className="object-cover transition-[filter] duration-300 group-hover:brightness-[0.8]"
          />
        </span>
        <span className="mt-6 max-w-[12em] text-[1.5rem] leading-[1.2] font-extrabold group-hover:underline">
          {article.heading}
        </span>
      </Link>
    </div>
  )
}

export function ArticlePager({ previous, next, previousLabel, nextLabel }: ArticlePagerProps) {
  if (!previous && !next) {
    return null
  }

  return (
    <nav
      aria-label="Article navigation"
      className="bg-[linear-gradient(#fff,#e3f3de_40%,#f3ebfd)] py-[var(--size-3rem)]"
    >
      <div className="site-container grid max-w-[53.375rem] gap-8 sm:grid-cols-2 sm:gap-16">
        <div>{previous ? <PagerCard label={previousLabel} article={previous} /> : null}</div>
        <div>{next ? <PagerCard label={nextLabel} article={next} /> : null}</div>
      </div>
    </nav>
  )
}
