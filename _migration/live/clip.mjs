// Viewport-sized screenshots at given scroll offsets (use "end" for the bottom).
// node _migration/live/clip.mjs <width> <path> <y1> <y2> ...
import { mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

const base = process.env.LIVE_BASE ?? "https://www.oliant.io"
const [width, path, ...offsets] = process.argv.slice(2)
const outDir = new URL("./shots/", import.meta.url)
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: Number(width), height: 1000 } })
await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 })
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 60))
  }
})
const height = await page.evaluate(() => document.body.scrollHeight)
for (const offset of offsets) {
  const y = offset === "end" ? height - 1000 : Number(offset)
  await page.evaluate((top) => window.scrollTo(0, top), y)
  await page.waitForTimeout(800)
  const name = `${path.slice(1).replace(/\//g, "__") || "index"}-${width}-at-${offset}.png`
  await page.screenshot({ path: fileURLToPath(new URL(name, outDir)) })
  console.log(name, height)
}
await browser.close()
