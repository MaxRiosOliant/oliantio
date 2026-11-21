// Dumps the computed-visible content of live pages, in DOM order.
// node _migration/live/visible.mjs /about-us /contact-us ...
import { mkdirSync, writeFileSync } from "node:fs"

import { chromium } from "playwright"

const base = process.env.LIVE_BASE ?? "https://www.oliant.io"
const outDir = new URL("./visible/", import.meta.url)
mkdirSync(outDir, { recursive: true })

const paths = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

for (const path of paths) {
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 })
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 1500))
  })
  const faq = []
  const roots = page.locator('[s-accordion="root"]')
  const count = await roots.count()
  for (let i = 0; i < count; i += 1) {
    const root = roots.nth(i)
    const content = root.locator('[s-accordion="content"]')
    if (!(await content.isVisible())) {
      await root.locator('[s-accordion="trigger"]').scrollIntoViewIfNeeded()
      await root.locator('[s-accordion="trigger"]').click()
      await page.waitForTimeout(800)
    }
    const question = (await root.locator('[s-accordion="trigger"]').innerText()).trim()
    const answer = await content.evaluate((el) =>
      [...el.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6")]
        .map((p) => {
          const links = [...p.querySelectorAll("a")].map((a) => `[${a.innerText.trim()}](${a.getAttribute("href")})`)
          return p.innerText.trim() + (links.length ? "  LINKS " + links.join(" ") : "")
        })
        .filter((t) => t.replace(/[\u200d\s]/g, "")),
    )
    faq.push(`FAQ ${i + 1}: ${question}\n    => ${answer.length ? answer.join("\n    => ") : "(EMPTY ANSWER)"}`)
  }

  const lines = await page.evaluate(() => {
    const out = []
    const textTags = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "LI", "A", "BUTTON", "LABEL", "FIGCAPTION", "BLOCKQUOTE", "TD", "TH", "SPAN", "STRONG", "EM"])
    const visible = (el) =>
      el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
      el.getBoundingClientRect().width > 0 &&
      el.getBoundingClientRect().height > 0
    const cls = (el) => (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "")
    const onlyInline = (el) =>
      [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) ||
      ([...el.children].length > 0 && [...el.children].every((c) => ["SPAN", "STRONG", "EM", "B", "I", "A", "BR", "SUP", "SUB", "CODE"].includes(c.tagName)))
    const walk = (el, depth) => {
      if (!(el instanceof Element)) return
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(el.tagName)) return
      if (el.tagName === "svg") return
      if (!visible(el)) return
      const pad = "  ".repeat(Math.min(depth, 12))
      if (["SECTION", "MAIN", "HEADER", "FOOTER", "NAV", "FORM", "ARTICLE"].includes(el.tagName)) {
        out.push(`${pad}<${el.tagName.toLowerCase()}${cls(el)}>`)
      }
      if (el.tagName === "IMG") {
        const r = el.getBoundingClientRect()
        out.push(`${pad}IMG ${el.currentSrc || el.src} alt="${el.alt}" ${Math.round(r.width)}x${Math.round(r.height)}`)
        return
      }
      if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
        const opts = el.tagName === "SELECT" ? " options=" + JSON.stringify([...el.options].map((o) => o.text)) : ""
        out.push(`${pad}${el.tagName} type=${el.type} name=${el.name} id=${el.id} placeholder="${el.placeholder ?? ""}" required=${el.required}${opts}`)
        return
      }
      if (el.tagName === "IFRAME") {
        out.push(`${pad}IFRAME ${el.src}`)
        return
      }
      const bg = getComputedStyle(el).backgroundImage
      if (bg && bg !== "none" && bg.includes("url(")) out.push(`${pad}BG ${cls(el)} ${bg.slice(0, 200)}`)
      if ((textTags.has(el.tagName) || onlyInline(el)) && el.innerText.trim()) {
        const links = [...el.querySelectorAll("a")].map((a) => `[${a.innerText.trim()}](${a.getAttribute("href")})`)
        const self = el.tagName === "A" ? ` -> ${el.getAttribute("href")}` : ""
        out.push(`${pad}${el.tagName}${cls(el)}: ${el.innerText.trim().replace(/\n+/g, " ⏎ ")}${self}${links.length ? "  LINKS " + links.join(" ") : ""}`)
        for (const img of el.querySelectorAll("img")) if (visible(img)) out.push(`${pad}  IMG ${img.currentSrc || img.src} alt="${img.alt}"`)
        return
      }
      if (el.tagName === "A") out.push(`${pad}A(empty)${cls(el)} -> ${el.getAttribute("href")}`)
      for (const child of el.children) walk(child, depth + 1)
    }
    const main = document.querySelector("main") ?? document.body
    const crumbs = document.querySelector(".breadcrumb_wrap")
    if (crumbs) walk(crumbs, 0)
    walk(main, 0)
    return out
  })

  const name = path === "/" ? "index" : path.replace(/^\//, "").replace(/\//g, "__")
  writeFileSync(new URL(`${name}.txt`, outDir), [...lines, "", ...faq].join("\n"))
  console.log(path, lines.length)
}

await browser.close()
