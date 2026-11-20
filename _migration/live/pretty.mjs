import { readFileSync, writeFileSync } from "node:fs"

function pretty(name) {
  const html = readFileSync(new URL(`./${name}.html`, import.meta.url), "utf8")
  const text = html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<svg[\s\S]*?<\/svg>/g, "[svg]")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/></g, ">\n<")
  writeFileSync(new URL(`./${name}.pretty.txt`, import.meta.url), text)
  console.log(name, text.length)
}

for (const name of [
  "hero-snippet",
  "services-snippet",
  "work-snippet",
  "process-snippet",
  "blog-snippet",
  "footer-snippet",
  "nav-snippet",
]) {
  pretty(name)
}
