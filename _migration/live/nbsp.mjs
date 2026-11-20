import { readFileSync } from "node:fs"
const html = readFileSync(new URL("../html/index.html", import.meta.url), "utf8")
const body = html.slice(html.indexOf("<body"))
const re = />([^<]*\u00a0[^<]*)</g
let match
while ((match = re.exec(body))) {
  console.log(JSON.stringify(match[1].replace(/\s+/g, " ").trim()))
}
