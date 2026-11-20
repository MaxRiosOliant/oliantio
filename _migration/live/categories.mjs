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
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ""
  const description =
    html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/i)?.[1] ??
    ""
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)?.[1] ?? ""
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
  )
  const mainAt = html.indexOf("<main")
  const main = mainAt >= 0 ? html.slice(mainAt, html.indexOf("</main>", mainAt)) : ""
  const texts = [...main.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<svg[\s\S]*?<\/svg>/gi, "").matchAll(/<(h1|h2|p)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => `${m[1]} ${JSON.stringify(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())}`)
    .filter((line) => line.length < 500)
  console.log("\n====", slug)
  console.log("TITLE", JSON.stringify(title))
  console.log("DESC", JSON.stringify(description))
  console.log("OG", JSON.stringify(ogTitle))
  console.log("H1", h1s.map((h) => JSON.stringify(h)).join(" | "))
  console.log(texts.slice(0, 12).join("\n"))
}
