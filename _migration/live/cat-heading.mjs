import { readFileSync } from "node:fs"

for (const slug of ["biz-tech", "innovation", "software-development", "talent", "technology"]) {
  const html = readFileSync(new URL(`../html/categories__${slug}.html`, import.meta.url), "utf8")
  const headings = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) =>
    `h${m[1]} ${m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}`,
  )
  const crumb = html.match(/breadcrumb_text[^>]*>([\s\S]*?)<\/div>/)?.[1].replace(/<[^>]+>/g, "").trim()
  console.log(slug, "crumb", crumb)
  console.log(headings.filter((h) => !h.includes("{")).slice(0, 8).join(" || "))
}
