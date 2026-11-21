import { notFound } from "next/navigation"

import { blog } from "@/content/blog"
import { ArticleAuthor } from "@/components/sections/ArticleAuthor"
import { ArticleBody } from "@/components/sections/ArticleBody"
import { ArticleCover } from "@/components/sections/ArticleCover"
import { ArticleHeader } from "@/components/sections/ArticleHeader"
import { ArticlePager } from "@/components/sections/ArticlePager"
import { FaqSection } from "@/components/sections/FaqSection"
import { RelatedLinks } from "@/components/sections/RelatedLinks"
import { ShareLinks } from "@/components/sections/ShareLinks"
import { site } from "@/config/site"
import { publishedArticles } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

export const ensureStatic = "navigation"

export function generateStaticParams() {
  return publishedArticles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/articles/[slug]">) {
  const { slug } = await params
  const article = publishedArticles.find((item) => item.slug === slug)
  if (!article) {
    notFound()
  }

  return buildMetadata({
    title: article.title,
    absoluteTitle: article.seo.title,
    description: article.seo.description ?? article.excerpt,
    path: article.path,
    image: article.seo.image ?? article.coverImage.src,
    noindex: article.seo.noindex,
  })
}

export default async function ArticlePage({
  params,
}: PageProps<"/articles/[slug]">) {
  const { slug } = await params
  const index = publishedArticles.findIndex((item) => item.slug === slug)
  const article = publishedArticles[index]
  if (!article) {
    notFound()
  }

  const newer = publishedArticles[index - 1]
  const older = publishedArticles[index + 1]
  const shareUrl = new URL(article.path, site.url).toString()
  const shareTitle = article.seo.title ?? article.title

  return (
    <>
      <ArticleHeader article={article} />
      <div className="site-container grid gap-12 pb-[var(--size-4rem)] desk:grid-cols-[minmax(0,791fr)_minmax(0,378fr)] desk:gap-[clamp(3rem,12vw,10.9rem)]">
        <article className="min-w-0">
          <ArticleAuthor article={article} />
          <ShareLinks url={shareUrl} title={shareTitle} />
          <ArticleCover article={article} />
          <ArticleBody loadBody={article.loadBody} />
          <ShareLinks url={shareUrl} title={shareTitle} />
          <ArticleAuthor article={article} />
        </article>
        <aside className="desk:pt-[6.5rem]">
          <div className="flex flex-col gap-12 desk:sticky desk:top-28">
            <RelatedLinks
              title={blog.article.relatedServices}
              links={article.relatedServices}
              tone="violet"
            />
            <RelatedLinks
              title={blog.article.relatedArticles}
              links={article.relatedArticles}
              tone="lime"
            />
          </div>
        </aside>
      </div>
      <ArticlePager
        previous={newer}
        next={older}
        previousLabel={blog.article.previous}
        nextLabel={blog.article.next}
      />
      {article.faq ? (
        <FaqSection
          title={article.faq.title}
          text={article.faq.text}
          items={article.faq.items.map((item) => ({
            question: item.question,
            parts: [{ text: item.answer }],
          }))}
        />
      ) : null}
    </>
  )
}
