import { readFileSync } from "node:fs"

const slug = process.argv[2] ?? "biz-tech"
const html = readFileSync(new URL(`../html/categories__${slug}.html`, import.meta.url), "utf8")
const mainAt = html.indexOf('id="main"')
const main = html.slice(mainAt, html.indexOf("footer_wrap", mainAt))
const text = main
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
  .replace(/<[^>]+>/g, "\n")
  .replace(/&amp;/g, "&")
  .replace(/&#x27;/g, "'")
  .replace(/&nbsp;/g, " ")
  .split("\n")
  .map((line) => line.replace(/\s+/g, " ").trim())
  .filter(Boolean)
console.log(text.slice(0, 40).join("\n"))
