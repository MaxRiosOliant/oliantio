import type { ReactNode } from "react"
import Image from "next/image"

import { formatContentDate } from "@/lib/content/format"
import type { ArticleMeta } from "@/lib/content/records"

type ArticleBylineProps = {
  article: ArticleMeta
  size?: "sm" | "lg"
  bio?: ReactNode
}

export function ArticleByline({ article, size = "sm", bio }: ArticleBylineProps) {
  const avatar = article.author.avatar
  const px = size === "lg" ? 80 : 56

  return (
    <div className="flex items-center gap-4">
      {avatar ? (
        <Image
          src={avatar}
          alt=""
          width={px}
          height={px}
          className="shrink-0 rounded-full object-cover"
          style={{ width: px, height: px }}
        />
      ) : null}
      <div className="flex flex-col gap-1">
        <p
          className={
            size === "lg"
              ? "text-base leading-[1.5] font-medium"
              : "text-[0.875rem] leading-[1.5] font-medium"
          }
        >
          {article.author.name}
        </p>
        {bio ? <div className="text-[0.875rem] leading-[1.5]">{bio}</div> : null}
        <p className="text-[0.875rem] leading-[1.5] text-brand-4">
          <time dateTime={article.date}>{formatContentDate(article.date)}</time>
        </p>
      </div>
    </div>
  )
}
