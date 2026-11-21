import Image from "next/image"
import Link from "next/link"

import { home } from "@/content/home"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { formatContentDate } from "@/lib/content/format"
import type { ArticleMeta } from "@/lib/content/records"

const insights = home.insights

function Category({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="relative z-10 inline-block rounded-[0.5rem] bg-[linear-gradient(90deg,#d4a5ff,#45ab34)] p-px max-[767px]:hidden"
    >
      <span className="block rounded-[0.5rem] bg-white px-3 py-1 text-[1rem] leading-[1.5] font-normal text-[#333]">
        {children}
      </span>
    </Link>
  )
}

function Author({ article }: { article: ArticleMeta }) {
  const avatar = article.author.avatar ?? "/images/home/avatar-placeholder.svg"

  return (
    <div className="flex w-full items-center gap-3">
      <Image
        src={avatar}
        alt=""
        width={56}
        height={56}
        unoptimized={avatar.endsWith(".svg")}
        className="size-14 shrink-0 rounded-full object-cover"
      />
      <div className="flex flex-col items-start gap-2">
        <p className="trim-text text-[0.875rem] leading-[1.5] font-medium">{article.author.name}</p>
        <p className="trim-text text-[0.875rem] leading-[1.5] text-brand-4">
          <time dateTime={article.date}>{formatContentDate(article.date)}</time>
        </p>
      </div>
    </div>
  )
}

function CardBody({ article }: { article: ArticleMeta }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-6 p-[var(--size-2rem)]">
      <div className="flex w-full flex-col items-start gap-4">
        <Category href={article.category.path}>{article.category.name}</Category>
        <h3 className="trim-text w-full text-[1.25rem] leading-[1.1] font-semibold tracking-[0em] text-balance group-hover:underline">
          <Link href={article.path} className="before:absolute before:inset-0">
            {article.heading}
          </Link>
        </h3>
      </div>
      <Author article={article} />
    </div>
  )
}

function Cover({
  article,
  className,
  sizes,
}: {
  article: ArticleMeta
  className: string
  sizes: string
}) {
  return (
    <div
      className={`relative overflow-hidden transition-[filter] duration-300 ease-[ease] group-hover:brightness-[0.7] ${className}`}
    >
      <Image src={article.coverImage.src} alt="" fill sizes={sizes} className="object-cover" />
    </div>
  )
}

function Featured({ article }: { article: ArticleMeta }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1rem] bg-ink text-paper">
      <Cover
        article={article}
        className="aspect-[7/3.6]"
        sizes="(min-width: 73rem) 40rem, 100vw"
      />
      <CardBody article={article} />
    </article>
  )
}

function Compact({ article }: { article: ArticleMeta }) {
  return (
    <article className="group relative flex overflow-hidden rounded-[1rem] bg-ink text-paper">
      <Cover
        article={article}
        className="aspect-[2/3.2] w-40 shrink-0"
        sizes="10rem"
      />
      <CardBody article={article} />
    </article>
  )
}

export function Insights({ articles }: { articles: readonly ArticleMeta[] }) {
  const [featured, ...rest] = articles

  if (!featured) {
    return null
  }

  return (
    <section className="bg-[linear-gradient(#142314,#45ab34)] py-[var(--size-7rem)] text-paper">
      <div className="site-container">
        <div className="flex max-w-xl flex-col gap-6">
          <h2 className="trim-display font-display text-[length:var(--size-3rem)] leading-none font-black tracking-[0em] text-outline">
            {insights.title}
          </h2>
          <p className="trim-text max-w-[40ch] text-[1.25rem] leading-[1.5] tracking-[0em]">{insights.text}</p>
        </div>
        <div className="mt-8 mb-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))] gap-4">
          <Featured article={featured} />
          <div className="hidden min-[768px]:block">
            {rest.map((article) => (
              <div key={article.path} className="mb-4">
                <Compact article={article} />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 min-[768px]:hidden">
            {rest.map((article) => (
              <Featured key={article.path} article={article} />
            ))}
          </div>
        </div>
        <ButtonLink href={insights.ctaHref}>{insights.cta}</ButtonLink>
      </div>
    </section>
  )
}
