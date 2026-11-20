import { readFileSync } from "node:fs"
const css = readFileSync(new URL("./webflow.css", import.meta.url), "utf8")
for (const name of ["section_hero_head", "section_hero_content", "hero_layout", "section_hero_subhead", "outline-text", "u-alignment-vertical"]) {
  let from = 0
  let n = 0
  while (n < 4) {
    const at = css.indexOf(name, from)
    if (at < 0) break
    const start = css.lastIndexOf("}", at) + 1
    const end = css.indexOf("}", at)
    const rule = css.slice(start, end + 1)
    if (rule.length < 500) console.log("\n", rule)
    else console.log("\n", rule.slice(0, 300), "...")
    from = at + name.length
    n++
  }
}
