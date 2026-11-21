// Full-page screenshots of live pages for layout reference.
// node _migration/live/shots.mjs 1440 /about-us /contact-us ...
import { mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

const base = process.env.LIVE_BASE ?? "https://www.oliant.io"
const [width, ...paths] = process.argv.slice(2)
const outDir = new URL("./shots/", import.meta.url)
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } })
for (const path of paths) {
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 })
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 1200))
  })
  const name = (path === "/" ? "index" : path.slice(1).replace(/\//g, "__")) + `-${width}.png`
  await page.screenshot({ path: fileURLToPath(new URL(name, outDir)), fullPage: true })
  console.log(name)
}
await browser.close()
