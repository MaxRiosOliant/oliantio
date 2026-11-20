import { readFileSync } from "node:fs"

const files = [
  "biz-tech",
  "innovation",
  "software-development",
  "talent",
  "technology",
]

for (const slug of files) {
  const html = readFileSync(new URL(`../html/categories__${slug}.html`, import.meta.url), "utf8")
  const mainAt = html.search(/<main\b/)
  console.log("\n====", slug, "main", mainAt)
  const start = html.indexOf("blog-posts")
  const slice = html.slice(Math.max(0, start - 1500), start + 400)
  const text = slice
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " | ")
  console.log(text.replace(/\s+/g, " ").slice(0, 1200))
}
