import { readFileSync, writeFileSync } from "node:fs"

const html = readFileSync(new URL("./home.html", import.meta.url), "utf8")
const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1])
writeFileSync(new URL("./inline.css", import.meta.url), styles.join("\n\n/* ---- */\n\n"))

const markers = [
  "section_hero_wrap",
  "home-services_wrap",
  "work_wrap",
  "process_wrap",
  "bloghome_wrap",
  "footer_wrap",
  "nav_wrap is-desktop",
]
for (const marker of markers) {
  const at = html.indexOf(marker)
  console.log(marker, at)
}

function sliceAround(marker, length) {
  const at = html.indexOf(marker)
  return html.slice(Math.max(0, at - 80), at + length)
}

writeFileSync(
  new URL("./hero-snippet.html", import.meta.url),
  sliceAround("section_hero_wrap", 12000),
)
writeFileSync(
  new URL("./services-snippet.html", import.meta.url),
  sliceAround("home-services_wrap", 14000),
)
writeFileSync(
  new URL("./work-snippet.html", import.meta.url),
  sliceAround("work_wrap", 8000),
)
writeFileSync(
  new URL("./process-snippet.html", import.meta.url),
  sliceAround("process_wrap", 8000),
)
writeFileSync(
  new URL("./blog-snippet.html", import.meta.url),
  sliceAround("bloghome_wrap", 18000),
)
writeFileSync(
  new URL("./footer-snippet.html", import.meta.url),
  sliceAround("footer_wrap", 22000),
)
writeFileSync(
  new URL("./nav-snippet.html", import.meta.url),
  sliceAround("nav_wrap is-desktop", 6000),
)

const border = html.indexOf(".home-services_card_border")
writeFileSync(
  new URL("./border.css", import.meta.url),
  html.slice(border, border + 1500),
)

