import { readFileSync, writeFileSync } from "node:fs"

const html = readFileSync(new URL("./home.html", import.meta.url), "utf8")
const at = html.indexOf("footer_logo_wrap")
const svg = html.slice(at).match(/<svg[\s\S]*?<\/svg>/)[0]
writeFileSync(
  new URL("../../public/images/home/footer-logo.svg", import.meta.url),
  svg,
)
console.log(svg.slice(0, 120), svg.length)
