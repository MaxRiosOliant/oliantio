import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"

const html = readFileSync(new URL("./home.html", import.meta.url), "utf8")

function svgsBetween(startMarker, endMarker) {
  const start = html.indexOf(startMarker)
  const end = html.indexOf(endMarker, start + startMarker.length)
  const slice = html.slice(start, end)
  return [...slice.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((match) => match[0])
}

const outDir = new URL("../../../public/images/home/", import.meta.url)
mkdirSync(outDir, { recursive: true })

const serviceIcons = svgsBetween("home-services_wrap", "work_wrap")
const workIcons = svgsBetween('class="work_wrap"', "process_wrap")
const footerIcons = svgsBetween("footer_wrap", "</body>")
console.log(
  "service icons",
  serviceIcons.length,
  "work icons",
  workIcons.length,
  "footer icons",
  footerIcons.length,
  footerIcons.map((svg) => svg.length),
)

const groups = {
  "service-web.svg": serviceIcons[0],
  "service-qa.svg": serviceIcons[1],
  "service-seo.svg": serviceIcons[2],
  "service-staff.svg": serviceIcons[3],
  "reason-1.svg": workIcons[0],
  "reason-2.svg": workIcons[1],
  "reason-3.svg": workIcons[2],
  "reason-4.svg": workIcons[3],
  "icon-phone.svg": footerIcons[1],
  "social-facebook.svg": footerIcons[2],
  "social-instagram.svg": footerIcons[3],
  "social-linkedin.svg": footerIcons[4],
  "social-x.svg": footerIcons[5],
  "social-youtube.svg": footerIcons[6],
}

for (const [name, svg] of Object.entries(groups)) {
  if (!svg) {
    console.log("no svg", name)
    continue
  }
  writeFileSync(new URL(name, outDir), svg)
  console.log(name, svg.length)
}

const logoAt = html.indexOf('class="nav_logo_wrap')
const logo = html.slice(logoAt).match(/<svg[\s\S]*?<\/svg>/)[0]
writeFileSync(new URL("logo.svg", outDir), logo)
console.log("logo", logo.length)

const curveAt = html.indexOf("section_hero_curve")
const curve = html.slice(curveAt).match(/<svg[\s\S]*?<\/svg>/)[0]
writeFileSync(new URL("hero-curve.svg", outDir), curve)
console.log("curve", curve.length, curve.slice(0, 180))
