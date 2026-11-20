import { readFileSync } from "node:fs"
const css = readFileSync(new URL("./webflow.css", import.meta.url), "utf8")
for (const name of ["home-blog_desktop", "home-blog_mobile"]) {
  let from = 0
  while (true) {
    const at = css.indexOf(name, from)
    if (at < 0) break
    const media = css.lastIndexOf("@media", at)
    const ruleStart = css.lastIndexOf("{", at)
    console.log("\n", name, "at", at)
    console.log("media:", media > at - 2500 ? css.slice(media, media + 120) : "far")
    console.log("rule:", css.slice(at, css.indexOf("}", at) + 1))
    from = at + name.length
  }
}
