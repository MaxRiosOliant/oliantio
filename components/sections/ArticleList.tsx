import { ArticleCard } from "@/components/sections/ArticleCard"
import type { ArticleMeta } from "@/lib/content/records"

type ArticleListProps = {
  articles: readonly ArticleMeta[]
}

export function ArticleList({ articles }: ArticleListProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16">
      {articles.length === 0 ? (
        <p>No articles yet</p>
      ) : (
        <ul className="flex flex-col gap-8">
          {articles.map((article) => (
            <li key={article.slug}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
