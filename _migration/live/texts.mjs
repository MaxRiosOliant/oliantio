import { readFileSync, writeFileSync } from "node:fs"

const html = readFileSync(new URL("../html/index.html", import.meta.url), "utf8")

const cleaned = html
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<svg[\s\S]*?<\/svg>/gi, "")

const texts = []
const re = />([^<]+)</g
let match
while ((match = re.exec(cleaned))) {
  const raw = match[1].replace(/\s+/g, " ").trim()
  if (!raw) continue
  if (raw.startsWith("/*") || raw.startsWith(".") || raw.includes("{")) continue
  texts.push(raw)
}

writeFileSync(new URL("./visible-texts.txt", import.meta.url), texts.join("\n"))
console.log(texts.length)
console.log(texts.join("\n"))
