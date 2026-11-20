import { readFileSync, writeFileSync } from "node:fs"

const html = readFileSync(new URL("../html/index.html", import.meta.url), "utf8")
const start = html.indexOf('class="nav_wrap is-desktop"')
const end = html.indexOf('class="nav_wrap is-mobile"')
const nav = html.slice(start, end)

function texts(chunk) {
  return [...chunk.replace(/<svg[\s\S]*?<\/svg>/g, "").matchAll(/>([^<]+)</g)]
    .map((m) => m[1].replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

const items = [...nav.matchAll(/<li class="nav_links_item">([\s\S]*?)<\/li>\s*(?=<li class="nav_links_item">|<ul class="nav_actions)/g)]
console.log("top items", items.length)

const lines = []
for (const item of items) {
  const block = item[1]
  const toggle = block.match(/nav_links_text">([^<]+)/)
  const link = block.match(/nav_links_link[^>]*href="([^"]*)"[^>]*>[\s\S]*?nav_links_text">([^<]+)/)
  if (toggle && block.includes("nav_dropdown")) {
    lines.push(`GROUP ${toggle[1]}`)
    const subs = [...block.matchAll(/<a href="([^"]*)"[^>]*class="[^"]*nav_dropdown_link[^"]*"[\s\S]*?nav_dropdown_text">([\s\S]*?)<\/div>/g)]
    for (const sub of subs) {
      const label = sub[2].replace(/<br\s*\/?>/g, " ").replace(/\s+/g, " ").trim()
      const green = block.slice(Math.max(0, sub.index - 120), sub.index).includes("is-green")
      lines.push(`  ${green ? "*" : "-"} ${label} -> ${sub[1]}`)
    }
  } else {
    const href = block.match(/href="([^"]*)"/)
    const label = texts(block)[0]
    lines.push(`LINK ${label} -> ${href?.[1]}`)
  }
}

const actions = nav.slice(nav.indexOf("nav_actions"))
lines.push("ACTIONS " + texts(actions).join(" | "))
writeFileSync(new URL("./nav-tree.txt", import.meta.url), lines.join("\n"))
console.log(lines.join("\n"))

const checks = [
  "Staff",
  "IT",
  "clients",
  "OLIANT",
  ".Net",
  "Privacy, Security",
]
for (const word of checks) {
  const at = html.indexOf(word)
  const slice = html.slice(at, at + 80)
  console.log("\nRAW", JSON.stringify(slice))
}
