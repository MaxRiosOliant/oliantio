import Image from "next/image"
import Link from "next/link"

import { ArticleByline } from "@/components/sections/ArticleByline"
import type { ArticleMeta } from "@/lib/content/records"

export function CategoryTag({
  href,
  children,
  arrow = false,
}: {
  href: string
  children: string
  arrow?: boolean
}) {
  return (
    <Link
      href={href}
      className="relative z-10 inline-block rounded-[0.5rem] bg-[linear-gradient(90deg,#d4a5ff,#45ab34)] p-px"
    >
      <span className="flex items-center gap-2 rounded-[0.4375rem] bg-white px-2 py-0.5 text-[0.875rem] leading-[1.5] text-ink hover:bg-neutral-1">
        {children}
        {arrow ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
            <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" />
          </svg>
        ) : null}
      </span>
    </Link>
  )
}

function GridCard({ article }: { article: ArticleMeta }) {
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[437/225] overflow-hidden">
        <Image
          src={article.coverImage.src}
          alt=""
          fill
          sizes="(min-width: 73rem) 28rem, (min-width: 48rem) 50vw, 100vw"
          className="object-cover transition-[filter] duration-300 group-hover:brightness-[0.8]"
        />
      </div>
      <div className="flex flex-1 flex-col items-start gap-4 px-2 pt-6 pb-4">
        <CategoryTag href={article.path}>{article.category.name}</CategoryTag>
        <h3 className="max-w-[18em] text-[1.25rem] leading-[1.1] font-extrabold group-hover:underline">
          {article.heading}
        </h3>
        <ArticleByline article={article} />
      </div>
      <Link href={article.path} aria-label={article.heading} className="absolute inset-0" />
    </article>
  )
}

type ArticleGridProps = {
  articles: readonly ArticleMeta[]
  eyebrow?: string
  title?: string
  cta?: { label: string; href: string }
}

export function ArticleGrid({ articles, eyebrow, title, cta }: ArticleGridProps) {
  return (
    <section className="site-container pb-[var(--size-4rem)]">
      {eyebrow || cta ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          {eyebrow ? (
            <h2 className="text-[0.875rem] leading-[1.5] tracking-[0.24em] text-[#a0a1a0] uppercase">
              {eyebrow}
            </h2>
          ) : null}
          {cta ? (
            <CategoryTag href={cta.href} arrow>
              {cta.label}
            </CategoryTag>
          ) : null}
        </div>
      ) : null}
      {title ? (
        <h1 className="mb-10 text-[length:var(--size-2-5rem)] leading-none font-black tracking-[-0.03em]">
          {title}
        </h1>
      ) : null}
      <ul className="grid gap-x-4 gap-y-8 md:grid-cols-2 desk:grid-cols-3">
        {articles.map((article) => (
          <li key={article.slug}>
            <GridCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  )
}
