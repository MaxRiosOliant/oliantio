import Image from "next/image"
import Link from "next/link"

import { ArticleByline } from "@/components/sections/ArticleByline"
import { CategoryTag } from "@/components/sections/ArticleGrid"
import { AuthorBio } from "@/components/sections/AuthorBio"
import type { ArticleMeta } from "@/lib/content/records"

type BlogFeaturedProps = {
  title: string
  featured: ArticleMeta
  latest: readonly ArticleMeta[]
  latestTitle: string
  readMore: string
}

function LatestCard({ article }: { article: ArticleMeta }) {
  return (
    <article className="group relative grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[0.5rem]">
        <Image
          src={article.coverImage.src}
          alt=""
          fill
          sizes="(min-width: 73rem) 15rem, 40vw"
          className="object-cover transition-[filter] duration-300 group-hover:brightness-[0.8]"
        />
      </div>
      <div className="flex flex-col items-start gap-4">
        <CategoryTag href={article.category.path}>{article.category.name}</CategoryTag>
        <h3 className="text-[1.25rem] leading-[1.3] font-black">
          <Link href={article.path} className="before:absolute before:inset-0 hover:underline">
            {article.heading}
          </Link>
        </h3>
        <ArticleByline article={article} />
      </div>
    </article>
  )
}

export function BlogFeatured({ title, featured, latest, latestTitle, readMore }: BlogFeaturedProps) {
  return (
    <section className="site-container grid gap-x-4 gap-y-12 pt-6 pb-[var(--size-4rem)] desk:grid-cols-2">
      <h1 className="text-[length:var(--size-2-5rem)] leading-none font-black tracking-[-0.03em] desk:col-span-2">
        {title}
      </h1>
      <article className="group relative flex flex-col gap-4">
        <p className="text-[0.875rem] leading-[1.5] tracking-[0.24em] text-[#a0a1a0] uppercase">
          {featured.category.name}
        </p>
        <h2 className="text-[length:var(--size-2-5rem)] leading-none font-black tracking-[-0.03em] text-balance">
          {featured.heading}
        </h2>
        <p className="text-base leading-[1.5]">{featured.excerpt}</p>
        <div className="relative aspect-[2/1] overflow-hidden rounded-[1rem]">
          <Image
            src={featured.coverImage.src}
            alt={featured.coverImage.alt}
            fill
            priority
            sizes="(min-width: 73rem) 42rem, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ArticleByline
            article={featured}
            size="lg"
            bio={<AuthorBio slug={featured.author.slug} />}
          />
          <CategoryTag href={featured.path} arrow>
            {readMore}
          </CategoryTag>
        </div>
      </article>
      <div>
        <h2 className="mb-12 text-[2rem] leading-[1.1] font-black tracking-[-0.03em]">
          {latestTitle}
        </h2>
        <ul className="flex flex-col gap-3">
          {latest.map((article) => (
            <li key={article.slug}>
              <LatestCard article={article} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
