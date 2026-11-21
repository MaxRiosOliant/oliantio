// Prints computed styles for selectors on a live page.
// node _migration/live/styles.mjs <width> <path> "<selector>" ...
import { chromium } from "playwright"

const base = process.env.LIVE_BASE ?? "https://www.oliant.io"
const [width, path, ...selectors] = process.argv.slice(2)
const props = [
  "display", "position", "width", "height", "max-width", "margin", "padding", "gap",
  "grid-template-columns", "flex-direction", "align-items", "justify-content", "text-align",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-transform",
  "color", "background-color", "background-image", "border", "border-radius", "box-shadow",
  "-webkit-text-stroke", "-webkit-text-fill-color", "object-fit", "aspect-ratio", "opacity", "top",
]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } })
await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 })
for (const selector of selectors) {
  const result = await page.evaluate(
    ({ selector, props }) => {
      const el = document.querySelector(selector)
      if (!el) return null
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      const out = { rect: `${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}` }
      for (const p of props) {
        const v = cs.getPropertyValue(p)
        if (v && !["none", "normal", "0px", "auto", "rgba(0, 0, 0, 0)", "static", "visible"].includes(v)) out[p] = v.slice(0, 220)
      }
      return out
    },
    { selector, props },
  )
  console.log(`\n## ${selector}`)
  console.log(result ? Object.entries(result).map(([k, v]) => `  ${k}: ${v}`).join("\n") : "  (not found)")
}
await browser.close()
