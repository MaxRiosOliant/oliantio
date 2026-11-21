import Image from "next/image"

import { blog } from "@/content/blog"
import { AuthorBio } from "@/components/sections/AuthorBio"
import { formatContentDate } from "@/lib/content/format"
import type { ArticleMeta } from "@/lib/content/records"

export function ArticleAuthor({ article }: { article: ArticleMeta }) {
  return (
    <div className="flex items-start gap-4 py-6">
      {article.author.avatar ? (
        <Image
          src={article.author.avatar}
          alt=""
          width={91}
          height={91}
          className="size-[91px] shrink-0 rounded-full object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-1 pt-2">
        <p className="text-base leading-[1.5] font-semibold">
          {blog.article.by} {article.author.name}
        </p>
        <div className="text-[0.875rem] leading-[1.5]">
          <AuthorBio slug={article.author.slug} />
        </div>
        <p className="text-[0.875rem] leading-[1.5] text-brand-4">
          <time dateTime={article.date}>{formatContentDate(article.date)}</time>
        </p>
      </div>
    </div>
  )
}
