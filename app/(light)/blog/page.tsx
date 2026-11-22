import { blog } from "@/content/blog"
import { ArticleGrid } from "@/components/sections/ArticleGrid"
import { BlogFeatured } from "@/components/sections/BlogFeatured"
import { CategoryChips } from "@/components/sections/CategoryChips"
import { site } from "@/config/site"
import { categories, publishedArticles } from "@/lib/content"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Blog",
  description: site.description,
  path: "/blog",
})

const stripSize = 3

export default function BlogPage() {
  const [featured, ...rest] = publishedArticles
  if (!featured) {
    return null
  }

  return (
    <>
      <CategoryChips categories={categories} />
      <BlogFeatured
        title={blog.title}
        featured={featured}
        latest={rest.slice(0, 3)}
        latestTitle={blog.latestTitle}
        readMore={blog.readMore}
      />
      {categories.map((category) => {
        const articles = publishedArticles
          .filter((article) => article.category.slug === category.slug)
          .slice(0, stripSize)
        return articles.length === 0 ? null : (
          <ArticleGrid
            key={category.slug}
            eyebrow={category.name}
            cta={{ label: blog.categoryCta(category.name), href: category.path }}
            articles={articles}
          />
        )
      })}
    </>
  )
}
