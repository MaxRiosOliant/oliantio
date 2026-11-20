import Link from "next/link"

import { formatContentDate } from "@/lib/content/format"
import type { ArticleMeta } from "@/lib/content/records"

type ArticleHeaderProps = {
  article: ArticleMeta
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  return (
    <header className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{article.heading}</h1>
      <p className="mt-4 text-sm text-foreground/70">
        <time dateTime={article.date}>{formatContentDate(article.date)}</time>
        <span aria-hidden="true"> · </span>
        <span>{article.author.name}</span>
        <span aria-hidden="true"> · </span>
        <Link href={article.category.path} className="underline">
          {article.category.name}
        </Link>
      </p>
    </header>
  )
}
