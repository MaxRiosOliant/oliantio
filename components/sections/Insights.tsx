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
      className="relative z-10 inline-flex rounded-full bg-paper px-3 py-1 text-sm leading-5 font-medium text-ink"
    >
      {children}
    </Link>
  )
}

function Author({ article }: { article: ArticleMeta }) {
  const avatar = article.author.avatar ?? "/images/home/avatar-placeholder.svg"

  return (
    <div className="flex items-center gap-3">
      <Image
        src={avatar}
        alt=""
        width={40}
        height={40}
        unoptimized={avatar.endsWith(".svg")}
        className="size-10 rounded-full object-cover"
      />
      <div>
        <p className="trim-text text-sm leading-5 font-medium">{article.author.name}</p>
        <p className="trim-text text-sm leading-5 text-brand">
          <time dateTime={article.date}>{formatContentDate(article.date)}</time>
        </p>
      </div>
    </div>
  )
}

function Featured({ article }: { article: ArticleMeta }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-ink text-paper">
      <div className="relative aspect-[7/3.6]">
        <Image
          src={article.coverImage.src}
          alt=""
          fill
          sizes="(min-width: 73rem) 40rem, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col items-start gap-5 p-6">
        <Category href={article.category.path}>{article.category.name}</Category>
        <h3 className="text-xl leading-snug font-bold">
          <Link href={article.path} className="before:absolute before:inset-0">
            {article.heading}
          </Link>
        </h3>
        <Author article={article} />
      </div>
    </article>
  )
}

function Compact({ article }: { article: ArticleMeta }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl bg-ink text-paper desk:flex-row">
      <div className="relative aspect-[7/3.6] desk:aspect-[2/3.2] desk:w-40 desk:shrink-0">
        <Image
          src={article.coverImage.src}
          alt=""
          fill
          sizes="(min-width: 73rem) 10rem, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="flex flex-col items-start gap-3">
          <Category href={article.category.path}>{article.category.name}</Category>
          <h3 className="text-xl leading-snug font-bold">
            <Link href={article.path} className="before:absolute before:inset-0">
              {article.heading}
            </Link>
          </h3>
        </div>
        <Author article={article} />
      </div>
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
          <div className="hidden flex-col gap-4 min-[768px]:flex">
            {rest.map((article) => (
              <Compact key={article.path} article={article} />
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
