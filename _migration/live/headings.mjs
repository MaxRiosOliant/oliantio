import { readFileSync } from "node:fs"
const html = readFileSync(new URL("../html/index.html", import.meta.url), "utf8")
const body = html.slice(html.indexOf("<body")).replace(/<style[\s\S]*?<\/style>/g, "")
const re = /<(h[1-6]|p)([^>]*)>([\s\S]*?)<\/\1>/g
let match
while ((match = re.exec(body))) {
  const text = match[3].replace(/<[^>]+>/g, "")
  if (!text.trim()) continue
  console.log(match[1], JSON.stringify(text.replace(/\n/g, " ")))
}
