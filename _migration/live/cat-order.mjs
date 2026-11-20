import { readFileSync } from "node:fs"
const html = readFileSync(new URL("../html/categories__biz-tech.html", import.meta.url), "utf8")
const at = html.indexOf("blog_all_category")
const chunk = html.slice(at, at + 4000)
const items = [...chunk.matchAll(/href="\/categories\/([^"]+)"[\s\S]*?button_gradient_text[^>]*>([\s\S]*?)<\/div>/g)]
for (const item of items) console.log(item[1], item[2].replace(/<[^>]+>/g, "").trim())
