import { readFileSync } from "node:fs"
const css = readFileSync(new URL("./webflow.css", import.meta.url), "utf8")
for (const name of ["radius-3", "radius-4", "radius-1", "work_background", "blog_card{", "footer_logo", "footer_social"]) {
  let from = 0
  let n = 0
  while (n < 3) {
    const at = css.indexOf(name, from)
    if (at < 0) break
    const start = css.lastIndexOf("}", at) + 1
    const end = css.indexOf("}", at)
    console.log("\n", css.slice(start, end + 1).slice(0, 400))
    from = at + name.length
    n++
  }
}
