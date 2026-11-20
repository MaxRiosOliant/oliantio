import Image from "next/image"

import type { ArticleMeta } from "@/lib/content/records"

type ArticleCoverProps = {
  article: ArticleMeta
}

export function ArticleCover({ article }: ArticleCoverProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4">
      <div className="relative aspect-video overflow-hidden rounded-md">
        <Image
          src={article.coverImage.src}
          alt={article.coverImage.alt}
          fill
          sizes="(min-width: 1024px) 960px, 100vw"
          className="object-cover"
          preload
        />
      </div>
    </section>
  )
}
