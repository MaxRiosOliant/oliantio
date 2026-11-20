import Image from "next/image"
import Link from "next/link"

import { formatContentDate } from "@/lib/content/format"
import type { ArticleMeta } from "@/lib/content/records"

type ArticleCardProps = {
  article: ArticleMeta
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-foreground/10">
      <Link href={article.path} className="relative block aspect-video">
        <Image
          src={article.coverImage.src}
          alt={article.coverImage.alt}
          fill
          sizes="(min-width: 1024px) 960px, 100vw"
          className="object-cover"
        />
      </Link>
      <div className="flex flex-col gap-3 p-5">
        <p className="text-sm text-foreground/70">
          <time dateTime={article.date}>{formatContentDate(article.date)}</time>
        </p>
        <h2 className="text-xl font-semibold tracking-tight">
          <Link href={article.path}>{article.title}</Link>
        </h2>
        <p className="text-base leading-7">{article.excerpt}</p>
        <p className="text-sm">
          <Link href={article.category.path} className="underline">
            {article.category.name}
          </Link>
        </p>
      </div>
    </article>
  )
}
