import Image from "next/image"

import type { ArticleMeta } from "@/lib/content/records"

type ArticleCoverProps = {
  article: ArticleMeta
}

export function ArticleCover({ article }: ArticleCoverProps) {
  return (
    <div className="relative my-2 aspect-[791/400] overflow-hidden rounded-[0.5rem]">
      <Image
        src={article.coverImage.src}
        alt={article.coverImage.alt}
        fill
        sizes="(min-width: 73rem) 44rem, calc(100vw - 2.5rem)"
        className="object-cover"
        preload
        fetchPriority="high"
      />
    </div>
  )
}
