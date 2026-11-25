import type { ComponentProps } from "react"
import Image from "next/image"

import { mdxComponents, type MdxContent } from "@/components/mdx"
import { publicImageSize } from "@/lib/images/dimensions"

type ArticleBodyProps = {
  loadBody: () => Promise<{ default: MdxContent }>
}

function ArticleImage({ src, alt }: ComponentProps<"img">) {
  if (typeof src !== "string") {
    return null
  }
  const size = publicImageSize(src)
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={size.width}
      height={size.height}
      sizes="(min-width: 73rem) 44rem, calc(100vw - 2.5rem)"
      className="my-4 h-auto w-full"
    />
  )
}

const articleComponents = { ...mdxComponents, img: ArticleImage }

const prose = [
  "text-base leading-6",
  "[&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:text-[2rem] [&_h2]:leading-none [&_h2]:font-extrabold",
  "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-2xl [&_h3]:leading-none [&_h3]:font-semibold",
  "[&_h4]:mt-6 [&_h4]:mb-3 [&_h4]:text-xl [&_h4]:font-semibold",
  "[&_p]:mb-3",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-10 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-10 [&_li]:pl-4",
  "[&_a]:underline [&_a]:decoration-brand-5 [&_a:hover]:text-brand-5",
  "[&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:bg-[#2b2b2b] [&_pre]:p-2 [&_pre]:text-[#f8f8f2]",
  "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-5 [&_blockquote]:pl-5",
  "[&_table]:my-6 [&_table]:w-full [&_td]:border [&_td]:border-neutral-1 [&_td]:p-2 [&_th]:border [&_th]:border-neutral-1 [&_th]:p-2 [&_th]:text-left",
].join(" ")

export async function ArticleBody({ loadBody }: ArticleBodyProps) {
  const { default: Content } = await loadBody()

  return (
    <div className={prose}>
      <Content components={articleComponents} />
    </div>
  )
}
