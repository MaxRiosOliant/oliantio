import { readFileSync } from "node:fs"

const css = readFileSync(new URL("./webflow.css", import.meta.url), "utf8")
const html = readFileSync(new URL("../html/index.html", import.meta.url), "utf8")

for (const name of ["home-blog_desktop", "home-blog_mobile", "home-blog_cms"]) {
  let from = 0
  let n = 0
  console.log("\n==", name)
  while (n < 6) {
    const at = css.indexOf(name, from)
    if (at < 0) break
    const start = css.lastIndexOf("}", at)
    const media = css.lastIndexOf("@media", at)
    const end = css.indexOf("}", at)
    const nearMedia = media > start - 80 ? css.slice(media, css.indexOf("{", media)) : ""
    console.log(nearMedia, css.slice(Math.max(start, at - 40), end + 1).slice(0, 300))
    from = at + name.length
    n++
  }
}

const blogAt = html.indexOf("bloghome_wrap")
const blogEnd = html.indexOf("footer_wrap", blogAt)
const blog = html.slice(blogAt, blogEnd)
const parts = blog.split(/class="(home-blog_desktop|home-blog_mobile)"/)
console.log("\nblog parts", parts.length)
for (let i = 1; i < parts.length; i += 2) {
  const kind = parts[i]
  const chunk = parts[i + 1].slice(0, 2500)
  const texts = [...chunk.matchAll(/>([^<]{2,})</g)]
    .map((m) => m[1].replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.startsWith(".") && !t.includes("{"))
  console.log("\n", kind, texts.join(" | "))
}
