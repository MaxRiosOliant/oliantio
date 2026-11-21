import { blog } from "@/content/blog"
import { Breadcrumbs } from "@/components/sections/Breadcrumbs"
import type { ArticleMeta } from "@/lib/content/records"

type ArticleHeaderProps = {
  article: ArticleMeta
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  return (
    <>
      <Breadcrumbs
        className="site-container pt-6"
        items={[
          { label: blog.homeLabel, href: "/" },
          { label: blog.breadcrumb, href: "/blog" },
          { label: article.category.name, href: article.category.path },
          { label: article.heading },
        ]}
      />
      <header className="site-container pt-[var(--size-10rem)] pb-6">
        <p className="mb-8 text-[0.875rem] leading-[1.5] tracking-[0.24em] text-[#a0a1a0] uppercase">
          {article.category.name}
        </p>
        <h1 className="mb-8 text-[length:var(--size-2-5rem)] leading-none font-black tracking-[-0.03em] text-balance">
          {article.heading}
        </h1>
        <p className="max-w-[662px] text-[1.25rem] leading-[1.5]">{article.excerpt}</p>
      </header>
    </>
  )
}
