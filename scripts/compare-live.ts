// Compares every migrated page against the live site and writes
// _migration/report/index.html (plus report.json).
//
// Requires a production build (npm run build). The script starts `next start`
// on port 3100 itself.
//
// node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/compare-live.ts [--only=/a,/b] [--no-shots]
//
// On the local production build, every page is also opened at 1440px and 390px
// to collect console errors and warnings, uncaught exceptions, and failed
// requests (analytics endpoints excluded).
//
// Windows behind TLS inspection: set NODE_OPTIONS=--use-system-ca.

import { spawn, type ChildProcess } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium, type Browser, type Page } from "playwright"

import { allowlist, type AllowEntry, type Matcher } from "./compare-live.allowlist.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const reportDir = path.join(root, "_migration", "report")
const shotsDir = path.join(reportDir, "shots")
const liveOrigin = "https://www.oliant.io"
const port = 3100
const localOrigin = `http://localhost:${port}`
const widths = [1440, 390] as const
const concurrency = 4
// Below this text/background contrast the header text counts as not visible.
const minHeaderContrast = 2

// Header states checked on the local site, all at scroll 0 with no hover.
// "from-home" loads / first and then navigates client-side, so routes kept
// hidden in the DOM by Next.js can leak styles into the visible page.
const headerStates: HeaderState[] = [
  { id: "1440", width: 1440, menuOpen: false, fromHome: false },
  { id: "390", width: 390, menuOpen: false, fromHome: false },
  { id: "390-menu", width: 390, menuOpen: true, fromHome: false },
  { id: "1440-from-home", width: 1440, menuOpen: false, fromHome: true },
]

// Pages that do not exist on the live site. They are reviewed locally
// (full text, screenshots, header contrast) and kept out of the live diff.
const newPages = [
  "/services/custom-development",
  "/services/development/java",
  "/services/development/node",
  "/services/development/python",
  "/services/development/webflow",
  "/services/development/wordpress",
  "/services/development/google-cloud-platform",
  "/services/development/aws",
  "/services/development/microsoft-azure",
]

const requestedPages = [
  "/",
  "/services/qa",
  "/services/digital-marketing-seo",
  "/services/staff-augmentation",
  "/services/mvp-development",
  "/services/web",
  "/services/development/react",
  "/services/development/angular",
  "/services/development/net",
  "/about-us",
  "/contact-us",
  "/schedule-a-call",
  "/privacy-policy",
  "/oliant-form-usa",
  "/blog",
  "/articles/the-hidden-burden-of-building-the-first-startup-team",
  "/articles/git-bash-commonly-used-commands",
]

type Side = "live" | "local"
type Region = "main" | "header" | "footer" | "pager"

type Snapshot = {
  status: number
  words: string[]
  headings: string[]
  paragraphs: string[]
  links: Record<Region, string[]>
  images: string[]
  // "noindex" when a robots meta tag contains that directive, otherwise "".
  robots: string
}

type TextHunk = {
  removed: string
  added: string
  before: string
  after: string
  reason?: string
}

type ItemDiff = {
  kind: string
  side: Side
  item: string
  reason?: string
}

type HeaderState = {
  id: string
  width: number
  menuOpen: boolean
  fromHome: boolean
}

type HeaderCheck = {
  state: string
  shot?: string
  // Lowest text/background contrast among visible header links and buttons.
  minContrast: number | null
  worst?: string
}

type PageIssue = {
  kind: "console" | "exception" | "request"
  level: "error" | "warning"
  message: string
  source?: string
  widths: number[]
}

type ErrorGroup = {
  classification: "MUST FIX" | "OK"
  reason: string
  kind: PageIssue["kind"]
  level: PageIssue["level"]
  message: string
  source?: string
  pages: { path: string; widths: number[] }[]
}

type PageResult = {
  path: string
  status: "PASS" | "NEEDS REVIEW" | "COPY REVIEW"
  mode?: "new"
  error?: string
  liveStatus?: number
  localStatus?: number
  text: TextHunk[]
  items: ItemDiff[]
  counts: { liveImages: number; localImages: number }
  imageFiles?: { live: string[]; local: string[] }
  shots: string[]
  header?: HeaderCheck[]
  outline?: string[]
  fullText?: string
  wordCount?: number
  errors?: PageIssue[]
}

// ---------- normalization ----------

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
    .replace(/[\u2018\u2019\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeHref(href: string) {
  let value = href.trim()
  for (const origin of [liveOrigin, "https://oliant.io", localOrigin]) {
    if (value === origin) return "/"
    if (value.startsWith(origin + "/") || value.startsWith(origin + "?") || value.startsWith(origin + "#")) {
      value = value.slice(origin.length)
    }
  }
  if (value.length > 1 && value.endsWith("/") && !value.includes("?")) value = value.slice(0, -1)
  return value
}

// ---------- diff ----------

type Op = { type: "eq" | "del" | "ins"; value: string }

// Myers O(ND) diff over token arrays.
function diffTokens(a: string[], b: string[]): Op[] {
  const n = a.length
  const m = b.length
  const max = n + m
  const offset = max + 1
  const v = new Int32Array(2 * max + 3)
  const trace: Int32Array[] = []
  outer: for (let d = 0; d <= max; d += 1) {
    // Only diagonals -d-1..d+1 are read when backtracking step d.
    trace.push(v.slice(offset - d - 1, offset + d + 2))
    for (let k = -d; k <= d; k += 2) {
      let x: number
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1]
      } else {
        x = v[offset + k - 1] + 1
      }
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x += 1
        y += 1
      }
      v[offset + k] = x
      if (x >= n && y >= m) break outer
    }
  }
  const ops: Op[] = []
  let x = n
  let y = m
  for (let d = trace.length - 1; d >= 0; d -= 1) {
    const vd = trace[d]
    const at = (diagonal: number) => vd[diagonal + d + 1]
    const k = x - y
    let prevK: number
    if (k === -d || (k !== d && at(k - 1) < at(k + 1))) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }
    const prevX = at(prevK)
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      ops.push({ type: "eq", value: a[x - 1] })
      x -= 1
      y -= 1
    }
    if (d > 0) {
      if (x === prevX) {
        ops.push({ type: "ins", value: b[y - 1] })
      } else {
        ops.push({ type: "del", value: a[x - 1] })
      }
    }
    x = prevX
    y = prevY
  }
  return ops.reverse()
}

function textHunks(live: string[], local: string[]): TextHunk[] {
  const ops = diffTokens(live, local)
  const hunks: TextHunk[] = []
  let index = 0
  while (index < ops.length) {
    if (ops[index].type === "eq") {
      index += 1
      continue
    }
    const start = index
    const removed: string[] = []
    const added: string[] = []
    while (index < ops.length && ops[index].type !== "eq") {
      if (ops[index].type === "del") removed.push(ops[index].value)
      else added.push(ops[index].value)
      index += 1
    }
    const before = ops
      .slice(Math.max(0, start - 8), start)
      .filter((op) => op.type === "eq")
      .map((op) => op.value)
    const after = ops
      .slice(index, index + 8)
      .filter((op) => op.type === "eq")
      .map((op) => op.value)
    hunks.push({
      removed: removed.join(" "),
      added: added.join(" "),
      before: before.join(" "),
      after: after.join(" "),
    })
  }
  return hunks
}

function multisetDiff(live: string[], local: string[]) {
  const remaining = new Map<string, number>()
  for (const item of local) remaining.set(item, (remaining.get(item) ?? 0) + 1)
  const liveOnly: string[] = []
  for (const item of live) {
    const count = remaining.get(item) ?? 0
    if (count > 0) remaining.set(item, count - 1)
    else liveOnly.push(item)
  }
  const localOnly = [...remaining.entries()].flatMap(([item, count]) => Array<string>(count).fill(item))
  return { liveOnly, localOnly }
}

// ---------- allowlist ----------

function matches(matcher: Matcher | undefined, value: string) {
  if (matcher === undefined) return value === ""
  if (typeof matcher === "string") return matcher === value
  if (typeof matcher === "function") return matcher(value)
  return matcher.test(value)
}

function pageMatches(entry: AllowEntry, pagePath: string) {
  const pages = Array.isArray(entry.pages) ? entry.pages : [entry.pages]
  return pages.some((page) => (typeof page === "string" ? page === pagePath : page.test(pagePath)))
}

function allowText(pagePath: string, hunk: TextHunk) {
  return allowlist.find(
    (entry) =>
      entry.kind === "text" &&
      pageMatches(entry, pagePath) &&
      matches(entry.removed, hunk.removed) &&
      matches(entry.added, hunk.added) &&
      (!entry.hunk || entry.hunk(hunk.removed, hunk.added)) &&
      (!entry.context || entry.context.test(`${hunk.before} ¦ ${hunk.after}`)),
  )?.reason
}

function allowItem(pagePath: string, diff: ItemDiff) {
  return allowlist.find(
    (entry) =>
      entry.kind === diff.kind &&
      entry.side === diff.side &&
      pageMatches(entry, pagePath) &&
      matches(entry.match, diff.item),
  )?.reason
}

// ---------- browser extraction ----------

async function settle(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.8))
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 80))
    }
    window.scrollTo(0, 0)
    await new Promise((resolve) => setTimeout(resolve, 1200))
  })
}

async function expandAccordions(page: Page, side: Side) {
  await page.evaluate((which) => {
    if (which === "live") {
      for (const content of document.querySelectorAll<HTMLElement>('[s-accordion="content"]')) {
        content.style.setProperty("display", "block", "important")
        content.style.setProperty("height", "auto", "important")
        content.style.setProperty("max-height", "none", "important")
        content.style.setProperty("opacity", "1", "important")
        content.style.setProperty("visibility", "visible", "important")
        content.style.setProperty("overflow", "visible", "important")
      }
    } else {
      for (const button of document.querySelectorAll<HTMLElement>("main [aria-controls][aria-expanded]")) {
        const panel = document.getElementById(button.getAttribute("aria-controls") ?? "")
        if (panel) panel.hidden = false
      }
    }
  }, side)
  await page.waitForTimeout(300)
}

async function extract(page: Page, side: Side) {
  return page.evaluate((which) => {
    const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)]
    const outsideMain = (el: Element) => !el.closest("main")
    const header =
      which === "live" ? all(".nav_component") : all("header").filter(outsideMain)
    const footer =
      which === "live" ? all(".footer_wrap") : all("footer").filter(outsideMain)
    const skip =
      which === "live"
        ? all(".nav_skip_wrap")
        : all('a[href="#main"]').filter(outsideMain)
    // The article prev/next block follows Webflow's CMS order, not dates, so it
    // is compared as its own link set instead of as body text and images.
    const pager =
      which === "live"
        ? all(".article_next-prev_wrap")
        : all('nav[aria-label="Article navigation"]')
    const excluded = [...header, ...footer, ...skip, ...pager]
    const inExcluded = (node: Node) => excluded.some((el) => el.contains(node))

    const cache = new Map<Element, boolean>()
    const visible = (el: Element): boolean => {
      const known = cache.get(el)
      if (known !== undefined) return known
      const rect = el.getBoundingClientRect()
      const result =
        el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
        rect.width > 1 &&
        rect.height > 1
      cache.set(el, result)
      return result
    }

    const transformed = (el: Element, value: string) => {
      const transform = getComputedStyle(el).textTransform
      if (transform === "uppercase") return value.toUpperCase()
      if (transform === "lowercase") return value.toLowerCase()
      if (transform === "capitalize") {
        return value.replace(/(^|\s)(\p{L})/gu, (_m, space: string, letter: string) => space + letter.toUpperCase())
      }
      return value
    }
    // Accessible text of a link, including visually hidden labels (Webflow puts
    // button labels in hidden spans), minus our generic new-tab hint.
    const linkText = (a: Element) => {
      const parts: string[] = []
      const textWalker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT)
      let textNode: Node | null
      while ((textNode = textWalker.nextNode())) {
        const parent = textNode.parentElement
        if (!parent || parent.closest("svg")) continue
        parts.push(transformed(parent, textNode.textContent ?? ""))
      }
      return parts.join(" ").replace(/\(opens in a new tab\)/g, "")
    }

    // Text nodes in the same block box are concatenated as rendered; a new
    // block box (or a <br>) starts a new chunk.
    const blockCache = new Map<Element, Element>()
    const blockOf = (el: Element): Element => {
      const known = blockCache.get(el)
      if (known) return known
      let current: Element | null = el
      while (current && current !== document.body) {
        const display = getComputedStyle(current).display
        if (display !== "inline" && display !== "contents") break
        current = current.parentElement
      }
      const block = current ?? document.body
      blockCache.set(el, block)
      return block
    }

    const words: string[] = []
    const skipTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "OPTION", "TEXTAREA"])
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
    const chunks: string[] = []
    let lastBlock: Element | null = null
    let node: Node | null = walker.currentNode
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.tagName === "BR") lastBlock = null
        if (el.tagName === "SELECT" && !inExcluded(el) && visible(el)) {
          const select = el as HTMLSelectElement
          chunks.push(select.options[select.selectedIndex]?.text ?? "")
          lastBlock = null
        }
        if (
          el.tagName === "INPUT" &&
          ["submit", "button"].includes((el as HTMLInputElement).type) &&
          !inExcluded(el) &&
          visible(el)
        ) {
          chunks.push((el as HTMLInputElement).value)
          lastBlock = null
        }
        continue
      }
      const parent = node.parentElement
      if (!parent || skipTags.has(parent.tagName) || parent.closest("svg, select")) continue
      if (!node.textContent) continue
      if (inExcluded(node) || !visible(parent)) continue
      const text = transformed(parent, node.textContent)
      const block = blockOf(parent)
      if (block === lastBlock && chunks.length > 0) {
        chunks[chunks.length - 1] += text
      } else if (text.trim()) {
        // Whitespace-only nodes only matter between inline runs of one block.
        chunks.push(text)
      } else {
        continue
      }
      lastBlock = block
    }
    for (const chunk of chunks) words.push(...chunk.split(/\s+/).filter(Boolean))
    const paragraphs = chunks.map((chunk) => chunk.replace(/\s+/g, " ").trim()).filter(Boolean)

    const mainScope = (el: Element) => !inExcluded(el)
    const headings = all("h1, h2, h3")
      .filter((el) => mainScope(el) && visible(el))
      .map((el) => `${el.tagName} ${el.innerText}`)

    const linkItems = (anchors: HTMLAnchorElement[]) =>
      anchors
        .map((a) => ({ href: a.getAttribute("href") ?? "", text: linkText(a) }))
        .filter((link) => !/^\/?#main$/.test(link.href))
    const anchorsIn = (roots: Element[]) =>
      roots.flatMap((rootEl) => [...rootEl.querySelectorAll<HTMLAnchorElement>("a[href]")])
    const links = {
      main: linkItems(all("a[href]").filter((a) => mainScope(a) && visible(a)) as HTMLAnchorElement[]),
      header: linkItems(anchorsIn(header)),
      footer: linkItems(anchorsIn(footer)),
      pager: linkItems(anchorsIn(pager).filter((a) => visible(a) && linkText(a).trim())),
    }

    const images = all("img")
      .filter((img) => mainScope(img) && visible(img))
      .map((img) => {
        const image = img as HTMLImageElement
        let src = image.currentSrc || image.src
        try {
          const url = new URL(src)
          src = url.searchParams.get("url") ?? url.pathname
        } catch {}
        return { alt: image.alt, file: decodeURIComponent(src.split("/").pop() ?? "") }
      })

    const robotsMeta = [...document.querySelectorAll("meta")].find(
      (meta) => meta.getAttribute("name")?.toLowerCase() === "robots",
    )
    const robots = /\bnoindex\b/i.test(robotsMeta?.getAttribute("content") ?? "") ? "noindex" : ""

    return { words, headings, links, images, paragraphs, robots }
  }, side)
}

// Site footer plus the bottom of the section above it, so the gap before the card shows.
async function footerBox(page: Page, side: Side) {
  return page.evaluate(
    ({ selector, above }) => {
      const footers = document.querySelectorAll(selector)
      const footer = footers[footers.length - 1]
      if (!footer) return null
      const box = footer.getBoundingClientRect()
      const top = Math.max(0, box.top + window.scrollY - above)
      return { x: 0, y: top, width: document.documentElement.clientWidth, height: box.bottom + window.scrollY - top }
    },
    { selector: side === "live" ? ".footer_wrap" : "footer", above: 160 },
  )
}

async function capture(
  browser: Browser,
  side: Side,
  pagePath: string,
  shots: boolean,
): Promise<{ snapshot: Snapshot; imageFiles: string[]; shotFiles: string[] }> {
  const origin = side === "live" ? liveOrigin : localOrigin
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const shotFiles: string[] = []
  try {
    const response = await page.goto(origin + pagePath, { waitUntil: "networkidle", timeout: 90000 })
    await settle(page)
    const name = slugFor(pagePath)
    if (shots) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await settle(page)
        const file = `${name}-${side}-${width}.jpg`
        await page.screenshot({ path: path.join(shotsDir, file), fullPage: true, type: "jpeg", quality: 55 })
        shotFiles.push(file)
        const footerClip = await footerBox(page, side)
        if (footerClip) {
          const footerFile = `${name}-${side}-${width}-footer.jpg`
          await page.screenshot({ path: path.join(shotsDir, footerFile), fullPage: true, clip: footerClip, type: "jpeg", quality: 70 })
          shotFiles.push(footerFile)
        }
      }
      await page.setViewportSize({ width: 1440, height: 900 })
      await settle(page)
    }
    await expandAccordions(page, side)
    const raw = await extract(page, side)
    const linkSet = (items: Array<{ href: string; text: string }>) => {
      const normalized = items.map((item) => ({
        href: normalizeHref(item.href),
        text: normalizeText(item.text),
      }))
      const withText = new Set(normalized.filter((item) => item.text).map((item) => item.href))
      return [
        ...new Set(
          normalized
            .filter((item) => item.text || !withText.has(item.href))
            .map((item) => `${item.text || "(no text)"} -> ${item.href}`),
        ),
      ]
    }
    return {
      snapshot: {
        status: response?.status() ?? 0,
        words: normalizeText(raw.words.join(" ")).split(" ").filter(Boolean),
        headings: raw.headings.map(normalizeText),
        links: {
          main: linkSet(raw.links.main),
          header: linkSet(raw.links.header),
          footer: linkSet(raw.links.footer),
          pager: linkSet(raw.links.pager),
        },
        images: raw.images.map((image) => `alt="${normalizeText(image.alt)}"`),
        paragraphs: raw.paragraphs.map((paragraph) => normalizeText(paragraph)),
        robots: raw.robots,
      },
      imageFiles: raw.images.map((image) => image.file),
      shotFiles,
    }
  } finally {
    await context.close()
  }
}

// ---------- header at load ----------

// Measures every visible link and button in the site header against the pixels
// actually rendered behind it: the header text is made transparent, the
// viewport is captured, and the background is the median-luminance pixel under
// each element.
async function headerContrast(page: Page) {
  const targets = await page.evaluate(() => {
    const header = [...document.querySelectorAll("header")].find(
      (el) => !el.closest("main") && el.checkVisibility(),
    )
    if (!header) return null
    const textColor = (el: Element) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim() && node.parentElement?.checkVisibility()) {
          return getComputedStyle(node.parentElement).color
        }
      }
      return getComputedStyle(el).color
    }
    return [...header.querySelectorAll<HTMLElement>("a, button")].flatMap((el) => {
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return []
      const rect = el.getBoundingClientRect()
      const left = Math.max(0, rect.left)
      const top = Math.max(0, rect.top)
      const right = Math.min(window.innerWidth, rect.right)
      const bottom = Math.min(window.innerHeight, rect.bottom)
      if (right - left < 2 || bottom - top < 2) return []
      const label = (el.innerText || el.getAttribute("aria-label") || el.textContent || el.tagName).trim()
      return [{ left, top, right, bottom, color: textColor(el), label: label.replace(/\s+/g, " ").slice(0, 40) }]
    })
  })
  if (!targets) return { minContrast: null, worst: "no visible site header" }

  const hideText = await page.addStyleTag({
    content:
      "header, header * { color: transparent !important; caret-color: transparent !important; transition: none !important; }",
  })
  await page.waitForTimeout(50)
  const background = (await page.screenshot({ type: "png" })).toString("base64")
  await hideText.evaluate((style) => style.remove())

  return page.evaluate(async ({ png, targets }) => {
    const image = new Image()
    image.src = `data:image/png;base64,${png}`
    await image.decode()
    const canvas = document.createElement("canvas")
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return { minContrast: null, worst: "no canvas" }
    context.drawImage(image, 0, 0)
    const scale = image.width / window.innerWidth

    const parse = (value: string) => {
      const parts = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1]
      return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 }
    }
    const channel = (value: number) => {
      const c = value / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    const luminance = (c: { r: number; g: number; b: number }) =>
      0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
    const contrast = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    let minContrast: number | null = null
    let worst = ""
    for (const { left, top, right, bottom, color, label } of targets) {
      const pixels = context.getImageData(
        Math.floor(left * scale),
        Math.floor(top * scale),
        Math.max(1, Math.floor((right - left) * scale)),
        Math.max(1, Math.floor((bottom - top) * scale)),
      ).data
      const samples: Array<{ r: number; g: number; b: number; l: number }> = []
      for (let i = 0; i < pixels.length; i += 4 * 3) {
        const pixel = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] }
        samples.push({ ...pixel, l: luminance(pixel) })
      }
      samples.sort((a, b) => a.l - b.l)
      const behind = samples[Math.floor(samples.length / 2)]
      const fg = parse(color)
      const blended = {
        r: fg.r * fg.a + behind.r * (1 - fg.a),
        g: fg.g * fg.a + behind.g * (1 - fg.a),
        b: fg.b * fg.a + behind.b * (1 - fg.a),
      }
      const ratio = contrast(blended, behind)
      if (minContrast === null || ratio < minContrast) {
        minContrast = ratio
        worst = `"${label}" ${ratio.toFixed(2)}:1 (text ${color} on rgb(${behind.r}, ${behind.g}, ${behind.b}))`
      }
    }
    return { minContrast, worst }
  }, { png: background, targets })
}

async function checkHeader(
  browser: Browser,
  side: Side,
  pagePath: string,
  state: HeaderState,
  shots: boolean,
): Promise<HeaderCheck> {
  const origin = side === "live" ? liveOrigin : localOrigin
  const context = await browser.newContext({ viewport: { width: state.width, height: 900 } })
  const page = await context.newPage()
  try {
    if (state.fromHome) {
      await page.goto(`${origin}/`, { waitUntil: "networkidle", timeout: 90000 })
      await page.evaluate((target) => {
        const router = (window as unknown as { next?: { router?: { push(href: string): void } } }).next?.router
        if (!router) throw new Error("window.next.router is not available")
        router.push(target)
      }, pagePath)
      await page.waitForURL(`${origin}${pagePath}`, { timeout: 30000 })
      await page.waitForLoadState("networkidle")
    } else {
      await page.goto(origin + pagePath, { waitUntil: "networkidle", timeout: 90000 })
    }
    await page.waitForTimeout(600)
    if (state.menuOpen) {
      const menuButton = page.getByRole("button", { name: "Open menu" })
      if ((await menuButton.count()) > 0) {
        await menuButton.click()
        await page.waitForTimeout(300)
      }
    }
    const scrollY = await page.evaluate(() => window.scrollY)
    let shot: string | undefined
    if (shots) {
      shot = `${slugFor(pagePath)}-${side}-${state.id}-top.jpg`
      await page.screenshot({ path: path.join(shotsDir, shot), type: "jpeg", quality: 70 })
    }
    const measured = side === "local" ? await headerContrast(page) : { minContrast: null, worst: undefined }
    return {
      state: state.id,
      shot,
      minContrast: measured.minContrast,
      worst: scrollY === 0 ? measured.worst : `${measured.worst ?? ""} (page was at scrollY ${scrollY})`,
    }
  } finally {
    await context.close()
  }
}

function slugFor(pagePath: string) {
  return pagePath === "/" ? "index" : pagePath.slice(1).replace(/\//g, "__")
}

// ---------- local console and network errors ----------

// Location strings look like "http://localhost:3100/file.js:12:3". The trailing
// line and column are not part of the URL.
function asUrl(raw: string) {
  return new URL(raw.replace(/:\d+:\d+$/, ""))
}

function hostIs(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`)
}

function isAnalyticsUrl(raw: string) {
  let url: URL
  try {
    url = asUrl(raw)
  } catch {
    return false
  }
  const host = url.hostname
  if (hostIs(host, "google-analytics.com") || host === "analytics.google.com") return true
  if (hostIs(host, "googletagmanager.com")) return true
  if (hostIs(host, "googleadservices.com") || hostIs(host, "doubleclick.net")) return true
  if (host === "analytics.ahrefs.com") return true
  if (host === "connect.facebook.net") return true
  if (hostIs(host, "facebook.com") && url.pathname.startsWith("/tr")) return true
  if (hostIs(host, "hotjar.com")) return true
  if (hostIs(host, "segment.io") || hostIs(host, "segment.com")) return true
  return false
}

function isAppUrl(raw: string) {
  try {
    const host = asUrl(raw).hostname
    return host === "localhost" || host === "127.0.0.1" || hostIs(host, "oliant.io")
  } catch {
    return false
  }
}

function isAssetUrl(raw: string) {
  try {
    const pathname = asUrl(raw).pathname
    if (pathname.startsWith("/_next/static/") || pathname.startsWith("/images/") || pathname.startsWith("/fonts/")) {
      return true
    }
    return /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|mp4|webm|pdf)$/i.test(pathname)
  } catch {
    return false
  }
}

function isIgnoredRequest(raw: string) {
  if (raw.startsWith("data:") || raw.startsWith("blob:") || raw.startsWith("chrome-extension:")) return true
  return isAnalyticsUrl(raw)
}

function clipMessage(value: string) {
  const clean = value.replace(/\r/g, "").trim()
  return clean.length > 2000 ? `${clean.slice(0, 2000)}…` : clean
}

function addIssue(issues: PageIssue[], issue: Omit<PageIssue, "widths">, width: number) {
  const existing = issues.find(
    (item) =>
      item.kind === issue.kind &&
      item.level === issue.level &&
      item.message === issue.message &&
      item.source === issue.source,
  )
  if (existing) {
    if (!existing.widths.includes(width)) existing.widths.push(width)
    return
  }
  issues.push({ ...issue, widths: [width] })
}

function isHydrationMessage(message: string) {
  return /hydrat|did not match|server rendered HTML|text content does not match|minified react error #(418|419|422|423|425)|switched to client rendering|a tree hydrated|cannot be a descendant of|cannot contain a nested|validateDOMNesting/i.test(
    message,
  )
}

function isDevOnlyMessage(message: string) {
  return /Download the React DevTools|React DevTools|\[Fast Refresh\]|\[HMR\]|webpack-dev-server|Fast Refresh|findDOMNode is deprecated|componentWill(?:ReceiveProps|Mount|Update)/i.test(
    message,
  )
}

function isThirdPartySource(source?: string) {
  if (!source) return false
  if (isAnalyticsUrl(source)) return true
  try {
    const host = asUrl(source).hostname
    return host !== "localhost" && host !== "127.0.0.1" && !hostIs(host, "oliant.io")
  } catch {
    return false
  }
}

// MUST FIX: hydration, uncaught exceptions, missing assets, failed app requests.
// OK: dev-only noise and third-party warnings.
function classifyIssue(issue: PageIssue): { classification: "MUST FIX" | "OK"; reason: string } {
  if (issue.kind === "exception") return { classification: "MUST FIX", reason: "uncaught exception" }
  if (issue.kind === "request") {
    const url = issue.source ?? ""
    if (isAssetUrl(url)) return { classification: "MUST FIX", reason: "missing asset" }
    if (isAppUrl(url) || !isThirdPartySource(url)) return { classification: "MUST FIX", reason: "failed app request" }
    return { classification: "OK", reason: "third-party" }
  }
  if (isHydrationMessage(issue.message)) return { classification: "MUST FIX", reason: "hydration" }
  if (isDevOnlyMessage(issue.message)) return { classification: "OK", reason: "dev-only" }
  if (/^Failed to load resource/i.test(issue.message)) {
    const url = issue.source ?? ""
    if (isAnalyticsUrl(url) || isThirdPartySource(url)) return { classification: "OK", reason: "third-party" }
    if (isAssetUrl(url)) return { classification: "MUST FIX", reason: "missing asset" }
    return { classification: "MUST FIX", reason: "failed app request" }
  }
  if (isThirdPartySource(issue.source)) return { classification: "OK", reason: "third-party" }
  if (issue.level === "error" || /uncaught|typeerror|referenceerror|syntaxerror/i.test(issue.message)) {
    return { classification: "MUST FIX", reason: "uncaught exception" }
  }
  if (/missing|404|not found|failed to (load|fetch)|asset/i.test(issue.message)) {
    return { classification: "MUST FIX", reason: "missing asset" }
  }
  return { classification: "OK", reason: "dev-only" }
}

// Fresh load at one viewport so hydration and network failures belong to that width.
async function collectAtWidth(browser: Browser, pagePath: string, width: number) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await context.newPage()
  const found: Array<Omit<PageIssue, "widths">> = []
  let open = true
  const push = (issue: Omit<PageIssue, "widths">) => {
    if (!open) return
    const message = clipMessage(issue.message)
    if (!message) return
    if (found.some((item) => item.kind === issue.kind && item.level === issue.level && item.message === message && item.source === issue.source)) {
      return
    }
    found.push({ ...issue, message })
  }
  page.on("console", (message) => {
    const type = message.type()
    if (type !== "error" && type !== "warning") return
    const location = message.location()
    const source = location.url
      ? `${location.url}:${location.lineNumber + 1}:${location.columnNumber + 1}`
      : undefined
    if (source && isAnalyticsUrl(source) && /^Failed to load resource/i.test(message.text())) return
    push({ kind: "console", level: type, message: message.text(), source })
  })
  page.on("pageerror", (error) => {
    const frame = error.stack?.split("\n").map((line) => line.trim()).find((line) => line.startsWith("at "))
    push({ kind: "exception", level: "error", message: error.message, source: frame })
  })
  page.on("response", (response) => {
    if (response.status() < 400) return
    const url = response.url()
    if (isIgnoredRequest(url)) return
    push({ kind: "request", level: "error", message: `HTTP ${response.status()}`, source: url })
  })
  page.on("requestfailed", (request) => {
    const url = request.url()
    if (isIgnoredRequest(url)) return
    const failure = request.failure()?.errorText ?? "failed"
    // Cancelled prefetches and superseded navigations, not a failed response.
    if (failure === "net::ERR_ABORTED") return
    push({ kind: "request", level: "error", message: failure, source: url })
  })
  try {
    await page.goto(localOrigin + pagePath, { waitUntil: "networkidle", timeout: 90000 })
    await settle(page)
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(300)
  } finally {
    open = false
    await context.close()
  }
  return found
}

async function collectLocalErrors(browser: Browser, pagePath: string): Promise<PageIssue[]> {
  const issues: PageIssue[] = []
  for (const width of widths) {
    try {
      for (const issue of await collectAtWidth(browser, pagePath, width)) addIssue(issues, issue, width)
    } catch (error) {
      addIssue(
        issues,
        {
          kind: "exception",
          level: "error",
          message: error instanceof Error ? error.message : String(error),
        },
        width,
      )
    }
  }
  return issues
}

function groupErrors(results: PageResult[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>()
  for (const result of results) {
    for (const issue of result.errors ?? []) {
      const classified = classifyIssue(issue)
      const key = [
        classified.classification,
        classified.reason,
        issue.kind,
        issue.level,
        issue.message.replace(/\s+/g, " ").trim(),
        issue.source ?? "",
      ].join("\0")
      let group = groups.get(key)
      if (!group) {
        group = {
          classification: classified.classification,
          reason: classified.reason,
          kind: issue.kind,
          level: issue.level,
          message: issue.message,
          source: issue.source,
          pages: [],
        }
        groups.set(key, group)
      }
      const page = group.pages.find((item) => item.path === result.path)
      if (page) {
        for (const width of issue.widths) if (!page.widths.includes(width)) page.widths.push(width)
      } else {
        group.pages.push({ path: result.path, widths: [...issue.widths] })
      }
    }
  }
  return [...groups.values()].sort((a, b) => {
    if (a.classification !== b.classification) return a.classification === "MUST FIX" ? -1 : 1
    if (b.pages.length !== a.pages.length) return b.pages.length - a.pages.length
    return a.message.localeCompare(b.message)
  })
}

async function comparePage(browser: Browser, pagePath: string, shots: boolean): Promise<PageResult> {
  try {
    const localStates = headerStates.filter((state) => !(state.fromHome && pagePath === "/"))
    const liveStates = shots ? headerStates.filter((state) => !state.menuOpen && !state.fromHome) : []
    const runStates = async (side: Side, states: HeaderState[]) => {
      const checks: HeaderCheck[] = []
      for (const state of states) checks.push(await checkHeader(browser, side, pagePath, state, shots))
      return checks
    }
    const [live, local, liveHeader, localHeader, errors] = await Promise.all([
      capture(browser, "live", pagePath, shots),
      capture(browser, "local", pagePath, shots),
      runStates("live", liveStates),
      runStates("local", localStates),
      collectLocalErrors(browser, pagePath),
    ])
    const text = textHunks(live.snapshot.words, local.snapshot.words).map((hunk) => ({
      ...hunk,
      reason: allowText(pagePath, hunk),
    }))
    const items: ItemDiff[] = []
    const addItems = (kind: string, liveItems: string[], localItems: string[]) => {
      const { liveOnly, localOnly } = multisetDiff(liveItems, localItems)
      for (const item of liveOnly) items.push({ kind, side: "live", item })
      for (const item of localOnly) items.push({ kind, side: "local", item })
    }
    addItems("heading", live.snapshot.headings, local.snapshot.headings)
    for (const region of ["main", "header", "footer", "pager"] as const) {
      addItems(`link:${region}`, live.snapshot.links[region], local.snapshot.links[region])
    }
    addItems("image", live.snapshot.images, local.snapshot.images)
    if (live.snapshot.images.length !== local.snapshot.images.length) {
      items.push({
        kind: "image-count",
        side: live.snapshot.images.length > local.snapshot.images.length ? "live" : "local",
        item: `${live.snapshot.images.length} live / ${local.snapshot.images.length} local`,
      })
    }
    if (live.snapshot.robots !== local.snapshot.robots) {
      if (live.snapshot.robots) {
        items.push({ kind: "robots", side: "live", item: live.snapshot.robots })
      }
      if (local.snapshot.robots) {
        items.push({ kind: "robots", side: "local", item: local.snapshot.robots })
      }
    }
    for (const diff of items) diff.reason = allowItem(pagePath, diff)
    if (live.snapshot.status !== 200 || local.snapshot.status !== 200) {
      items.push({
        kind: "status",
        side: local.snapshot.status !== 200 ? "local" : "live",
        item: `HTTP live ${live.snapshot.status}, local ${local.snapshot.status}`,
      })
      const last = items[items.length - 1]
      last.reason = allowItem(pagePath, last)
    }
    for (const check of localHeader) {
      if (check.minContrast !== null && check.minContrast < minHeaderContrast) {
        items.push({
          kind: "header-contrast",
          side: "local",
          item: `${check.state}px at scroll 0, no hover: header text not visible, lowest ${check.worst}`,
        })
      }
    }
    const failing = text.some((hunk) => !hunk.reason) || items.some((diff) => !diff.reason)
    return {
      path: pagePath,
      status: failing ? "NEEDS REVIEW" : "PASS",
      liveStatus: live.snapshot.status,
      localStatus: local.snapshot.status,
      text,
      items,
      counts: { liveImages: live.snapshot.images.length, localImages: local.snapshot.images.length },
      imageFiles: { live: live.imageFiles, local: local.imageFiles },
      shots: [
        ...live.shotFiles,
        ...local.shotFiles,
        ...[...liveHeader, ...localHeader].flatMap((check) => (check.shot ? [check.shot] : [])),
      ],
      header: localHeader,
      errors,
    }
  } catch (error) {
    return {
      path: pagePath,
      status: "NEEDS REVIEW",
      error: error instanceof Error ? error.message : String(error),
      text: [],
      items: [],
      counts: { liveImages: 0, localImages: 0 },
      shots: [],
      errors: [],
    }
  }
}

async function reviewNewPage(browser: Browser, pagePath: string, shots: boolean): Promise<PageResult> {
  try {
    const localStates = headerStates.filter((state) => !(state.fromHome && pagePath === "/"))
    const header: HeaderCheck[] = []
    const [local, , errors] = await Promise.all([
      capture(browser, "local", pagePath, shots),
      (async () => {
        for (const state of localStates) header.push(await checkHeader(browser, "local", pagePath, state, shots))
      })(),
      collectLocalErrors(browser, pagePath),
    ])
    const items: ItemDiff[] = []
    if (local.snapshot.status !== 200) {
      items.push({ kind: "status", side: "local", item: `HTTP local ${local.snapshot.status}` })
    }
    for (const check of header) {
      if (check.minContrast !== null && check.minContrast < minHeaderContrast) {
        items.push({
          kind: "header-contrast",
          side: "local",
          item: `${check.state} at scroll 0, no hover: header text not visible, lowest ${check.worst}`,
        })
      }
    }
    const fullText = local.snapshot.paragraphs.join("\n\n")
    return {
      path: pagePath,
      mode: "new",
      status: items.length > 0 ? "NEEDS REVIEW" : "COPY REVIEW",
      localStatus: local.snapshot.status,
      text: [],
      items,
      counts: { liveImages: 0, localImages: local.snapshot.images.length },
      imageFiles: { live: [], local: local.imageFiles },
      shots: [...local.shotFiles, ...header.flatMap((check) => (check.shot ? [check.shot] : []))],
      header,
      outline: local.snapshot.headings,
      fullText,
      wordCount: fullText.split(/\s+/).filter(Boolean).length,
      errors,
    }
  } catch (error) {
    return {
      path: pagePath,
      mode: "new",
      status: "NEEDS REVIEW",
      error: error instanceof Error ? error.message : String(error),
      text: [],
      items: [],
      counts: { liveImages: 0, localImages: 0 },
      shots: [],
      errors: [],
    }
  }
}

// ---------- report ----------

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function errorColumn(result: PageResult) {
  const issues = result.errors ?? []
  if (issues.length === 0) return "<td>0</td>"
  const mustFix = issues.filter((issue) => classifyIssue(issue).classification === "MUST FIX").length
  const ok = issues.length - mustFix
  const parts = [mustFix ? `<b>${mustFix} MUST FIX</b>` : "", ok ? `${ok} OK` : ""].filter(Boolean)
  return `<td class="${mustFix ? "error" : ""}">${parts.join(", ")}</td>`
}

function renderIssues(result: PageResult) {
  const issues = result.errors ?? []
  if (issues.length === 0) return ""
  const mustFix = issues.some((issue) => classifyIssue(issue).classification === "MUST FIX")
  const rows = issues
    .map((issue) => {
      const classified = classifyIssue(issue)
      return `<tr class="${classified.classification === "MUST FIX" ? "open" : "allowed"}">
        <td>${classified.classification === "MUST FIX" ? "<b>MUST FIX</b>" : "OK"} · ${escapeHtml(classified.reason)}</td>
        <td>${issue.widths.join(", ")}</td>
        <td>${escapeHtml(issue.kind)} ${escapeHtml(issue.level)}</td>
        <td class="err">${escapeHtml(issue.message)}</td>
        <td class="err">${issue.source ? escapeHtml(issue.source) : ""}</td>
      </tr>`
    })
    .join("")
  return `<details ${mustFix ? "open" : ""}><summary>Errors (${issues.length})</summary>
    <table class="diffs"><thead><tr><th>Class</th><th>Width</th><th>Kind</th><th>Message</th><th>Source</th></tr></thead>
    <tbody>${rows}</tbody></table></details>`
}

function renderErrorSummary(results: PageResult[]) {
  const groups = groupErrors(results)
  const mustFix = groups.filter((group) => group.classification === "MUST FIX").length
  const intro = `<h2>Errors</h2>
    <p>Collected on the local production build at 1440px and 390px: console errors and warnings (message and source), uncaught exceptions, and failed requests (HTTP status 400 or higher, or a network failure). Analytics endpoints are excluded. Requests the browser cancels (<code>net::ERR_ABORTED</code>) are not counted. ${mustFix} MUST FIX, ${groups.length - mustFix} OK, grouped by unique error.</p>`
  if (groups.length === 0) return `${intro}<p>No console errors, warnings, uncaught exceptions, or failed requests.</p>`
  const rows = groups
    .map((group) => {
      const pages = group.pages
        .sort((a, b) => a.path.localeCompare(b.path))
        .map(
          (page) =>
            `<a href="#${slugFor(page.path)}">${escapeHtml(page.path)}</a> <span class="meta">(${page.widths.join(", ")})</span>`,
        )
        .join("<br>")
      return `<tr class="${group.classification === "MUST FIX" ? "open" : "allowed"}">
        <td>${group.classification === "MUST FIX" ? "<b>MUST FIX</b>" : "OK"}</td>
        <td>${escapeHtml(group.reason)}</td>
        <td>${escapeHtml(group.kind)} ${escapeHtml(group.level)}</td>
        <td class="err">${escapeHtml(group.message)}</td>
        <td class="err">${group.source ? escapeHtml(group.source) : ""}</td>
        <td>${pages}</td>
      </tr>`
    })
    .join("")
  return `${intro}<table class="diffs"><thead><tr><th>Class</th><th>Why</th><th>Kind</th><th>Message</th><th>Source</th><th>Pages</th></tr></thead><tbody>${rows}</tbody></table>`
}

function renderPage(result: PageResult) {
  const id = slugFor(result.path)
  const open = result.text.filter((hunk) => !hunk.reason).length + result.items.filter((diff) => !diff.reason).length
  const allowed = result.text.filter((hunk) => hunk.reason).length + result.items.filter((diff) => diff.reason).length
  const hunkRow = (hunk: TextHunk) => `
    <tr class="${hunk.reason ? "allowed" : "open"}">
      <td>text</td>
      <td><span class="ctx">…${escapeHtml(hunk.before)}</span>
        ${hunk.removed ? `<del>${escapeHtml(hunk.removed)}</del>` : ""}
        ${hunk.added ? `<ins>${escapeHtml(hunk.added)}</ins>` : ""}
        <span class="ctx">${escapeHtml(hunk.after)}…</span></td>
      <td>${hunk.reason ? escapeHtml(hunk.reason) : "<b>unexplained</b>"}</td>
    </tr>`
  const itemRow = (diff: ItemDiff) => `
    <tr class="${diff.reason ? "allowed" : "open"}">
      <td>${escapeHtml(diff.kind)}</td>
      <td>${diff.side === "live" ? "<del>live only</del>" : "<ins>local only</ins>"} ${escapeHtml(diff.item)}</td>
      <td>${diff.reason ? escapeHtml(diff.reason) : "<b>unexplained</b>"}</td>
    </tr>`
  const shotPairs = widths
    .map((width) => {
      const liveShot = result.shots.find((file) => file.endsWith(`-live-${width}.jpg`))
      const localShot = result.shots.find((file) => file.endsWith(`-local-${width}.jpg`))
      if (!liveShot || !localShot) return ""
      return `
      <div class="pair w${width}">
        <figure><figcaption>live · ${width}px</figcaption><img loading="lazy" src="shots/${liveShot}" alt="Live ${escapeHtml(result.path)} at ${width}px"></figure>
        <figure><figcaption>local · ${width}px</figcaption><img loading="lazy" src="shots/${localShot}" alt="Local ${escapeHtml(result.path)} at ${width}px"></figure>
      </div>`
    })
    .join("")
  const footerPairs = widths
    .map((width) => {
      const liveShot = result.shots.find((file) => file.endsWith(`-live-${width}-footer.jpg`))
      const localShot = result.shots.find((file) => file.endsWith(`-local-${width}-footer.jpg`))
      if (!liveShot || !localShot) return ""
      return `
      <div class="pair w${width}">
        <figure><figcaption>live · ${width}px · footer</figcaption><img loading="lazy" src="shots/${liveShot}" alt="Live ${escapeHtml(result.path)} footer at ${width}px"></figure>
        <figure><figcaption>local · ${width}px · footer</figcaption><img loading="lazy" src="shots/${localShot}" alt="Local ${escapeHtml(result.path)} footer at ${width}px"></figure>
      </div>`
    })
    .join("")
  const topShot = (side: Side, state: string) =>
    result.shots.find((file) => file.endsWith(`-${side}-${state}-top.jpg`))
  const headerFigures = headerStates
    .map((state) => {
      const check = result.header?.find((item) => item.state === state.id)
      const localShot = topShot("local", state.id)
      const liveShot = topShot("live", state.id)
      if (!check && !localShot) return ""
      const contrast =
        check?.minContrast == null
          ? check?.worst ?? "not measured"
          : `lowest contrast ${check.minContrast.toFixed(2)}:1 ${check.minContrast < minHeaderContrast ? "<b>NOT VISIBLE</b>" : ""} · ${escapeHtml(check.worst ?? "")}`
      const figure = (side: Side, file: string | undefined) =>
        file
          ? `<figure><figcaption>${side} · ${escapeHtml(state.id)}</figcaption><img loading="lazy" src="shots/${file}" alt="${side} ${escapeHtml(result.path)} header, ${escapeHtml(state.id)}"></figure>`
          : ""
      return `<p class="meta">${escapeHtml(state.id)}: ${contrast}</p>
      <div class="pair w${state.width}">${figure("live", liveShot)}${figure("local", localShot)}</div>`
    })
    .join("")
  return `
  <section id="${id}">
    <h2><span class="badge ${result.status === "PASS" ? "pass" : "review"}">${result.status}</span>
      <a href="${liveOrigin}${result.path}">${escapeHtml(result.path)}</a></h2>
    <p class="meta">HTTP live ${result.liveStatus ?? "?"} / local ${result.localStatus ?? "?"} ·
      images live ${result.counts.liveImages} / local ${result.counts.localImages} ·
      ${open} unexplained, ${allowed} allowlisted</p>
    ${result.error ? `<p class="error">${escapeHtml(result.error)}</p>` : ""}
    ${renderIssues(result)}
    ${
      result.imageFiles
        ? `<details><summary>Images in main content</summary><table><tr><th>Live (${result.imageFiles.live.length})</th><th>Local (${result.imageFiles.local.length})</th></tr>
      <tr><td>${result.imageFiles.live.map(escapeHtml).join("<br>")}</td><td>${result.imageFiles.local.map(escapeHtml).join("<br>")}</td></tr></table></details>`
        : ""
    }
    ${
      result.text.length + result.items.length
        ? `<details ${open ? "open" : ""}><summary>Differences</summary><table class="diffs">
      <thead><tr><th>Kind</th><th>Difference</th><th>Reason</th></tr></thead>
      <tbody>${result.text.map(hunkRow).join("")}${result.items.map(itemRow).join("")}</tbody></table></details>`
        : "<p>No differences.</p>"
    }
    <details><summary>Screenshots</summary>${shotPairs || "<p>No screenshots in this run.</p>"}</details>
    <details><summary>Footer (with the end of the previous section)</summary>${footerPairs || "<p>No screenshots in this run.</p>"}</details>
    <details><summary>Header at load (scroll 0, no hover)</summary>${headerFigures || "<p>Not checked in this run.</p>"}</details>
  </section>`
}

function badgeClass(status: PageResult["status"]) {
  if (status === "PASS") return "pass"
  if (status === "COPY REVIEW") return "copyreview"
  return "review"
}

function renderNewPage(result: PageResult) {
  const id = slugFor(result.path)
  const shots = widths
    .map((width) => {
      const file = result.shots.find((name) => name.endsWith(`-local-${width}.jpg`))
      if (!file) return ""
      return `<figure><figcaption>local · ${width}px · scroll 0</figcaption><img loading="lazy" src="shots/${file}" alt="Local ${escapeHtml(result.path)} at ${width}px"></figure>`
    })
    .join("")
  const headerNotes = headerStates
    .map((state) => {
      const check = result.header?.find((item) => item.state === state.id)
      if (!check) return ""
      const contrast =
        check.minContrast == null
          ? check.worst ?? "not measured"
          : `lowest contrast ${check.minContrast.toFixed(2)}:1${check.minContrast < minHeaderContrast ? " NOT VISIBLE" : ""} · ${check.worst ?? ""}`
      const file = result.shots.find((name) => name.endsWith(`-local-${state.id}-top.jpg`))
      const figure = file
        ? `<figure><figcaption>header · ${escapeHtml(state.id)}</figcaption><img loading="lazy" src="shots/${file}" alt="Local ${escapeHtml(result.path)} header, ${escapeHtml(state.id)}"></figure>`
        : ""
      return `<p class="meta">${escapeHtml(state.id)}: ${escapeHtml(contrast)}</p>${figure}`
    })
    .join("")
  const issues = result.items
    .map((diff) => `<li>${escapeHtml(diff.kind)}: ${escapeHtml(diff.item)}</li>`)
    .join("")
  return `
  <section id="${id}">
    <h3><span class="badge ${badgeClass(result.status)}">${result.status}</span> ${escapeHtml(result.path)}</h3>
    <p class="meta">Not on the live site · HTTP local ${result.localStatus ?? "?"} · ${result.wordCount ?? 0} words in main · indexable</p>
    ${result.error ? `<p class="error">${escapeHtml(result.error)}</p>` : ""}
    ${renderIssues(result)}
    ${issues ? `<ul>${issues}</ul>` : ""}
    <h4>Outline</h4>
    <ol class="outline">${(result.outline ?? []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol>
    <h4>Full page text</h4>
    <div class="copy">${escapeHtml(result.fullText ?? "")}</div>
    <h4>Screenshots</h4>
    <div class="pair">${shots || "<p>No screenshots in this run.</p>"}</div>
    <h4>Header at load (scroll 0, no hover)</h4>
    ${headerNotes || "<p>Not checked in this run.</p>"}
  </section>`
}

function renderReport(results: PageResult[], placeholderHrefs: string[]) {
  const compared = results.filter((result) => result.mode !== "new").sort((a, b) => a.path.localeCompare(b.path))
  const fresh = results.filter((result) => result.mode === "new").sort((a, b) => a.path.localeCompare(b.path))
  const pass = compared.filter((result) => result.status === "PASS").length
  const rows = compared
    .map((result) => {
      const open = result.text.filter((hunk) => !hunk.reason).length + result.items.filter((diff) => !diff.reason).length
      const allowed = result.text.filter((hunk) => hunk.reason).length + result.items.filter((diff) => diff.reason).length
      return `<tr><td><a href="#${slugFor(result.path)}">${escapeHtml(result.path)}</a></td>
        <td><span class="badge ${badgeClass(result.status)}">${result.status}</span></td>
        <td>${open}</td><td>${allowed}</td>${errorColumn(result)}</tr>`
    })
    .join("")
  const newRows = fresh
    .map(
      (result) => `<tr><td><a href="#${slugFor(result.path)}">${escapeHtml(result.path)}</a></td>
        <td>${result.wordCount ?? ""}</td>
        <td><span class="badge ${badgeClass(result.status)}">${result.status}</span></td>${errorColumn(result)}</tr>`,
    )
    .join("")
  const placeholder =
    placeholderHrefs.length === 0
      ? `<p>Local HTML contains no <code>href="#"</code>.</p>`
      : `<p class="error">Local HTML still has <code>href="#"</code> on: ${placeholderHrefs.map(escapeHtml).join(", ")}</p>`
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Live vs local comparison</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font: 14px/1.5 system-ui, sans-serif; margin: 2rem; color: #201e28; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: .35rem .5rem; text-align: left; vertical-align: top; }
  .badge { display: inline-block; padding: .1rem .5rem; border-radius: .25rem; font-size: 12px; font-weight: 700; }
  .pass { background: #d7f5d0; color: #1e5c12; } .review { background: #ffe1d6; color: #8a2a00; }
  .copyreview { background: #fff4cc; color: #6a5200; }
  .copy { white-space: pre-wrap; background: #f6f6f7; padding: 1rem 1.25rem; border: 1px solid #ddd; max-width: 78ch; }
  .outline { margin: .5rem 0 1rem; padding-left: 1.25rem; }
  section { border-top: 2px solid #201e28; margin-top: 2.5rem; padding-top: 1rem; }
  tr.allowed { color: #777; } tr.open { background: #fff7f3; }
  del { background: #ffd7d7; text-decoration: line-through; } ins { background: #d7ffd9; text-decoration: none; }
  .ctx { color: #999; } .meta { color: #555; } .error { color: #b00; font-weight: 700; }
  td.err { max-width: 36rem; white-space: pre-wrap; word-break: break-word; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
  .pair.w390 { grid-template-columns: repeat(2, minmax(0, 390px)); }
  figure { margin: 0; max-height: 1600px; overflow: auto; border: 1px solid #ccc; }
  figcaption { position: sticky; top: 0; background: #fff; padding: .25rem .5rem; font-weight: 600; }
  figure img { width: 100%; display: block; }
</style></head><body>
<h1>Live vs local comparison</h1>
<p>Generated ${new Date().toISOString()} · ${pass}/${compared.length} PASS · live ${liveOrigin} vs local production build (next start).</p>
${placeholder}
<p>Checks per page: normalized visible main-content text (word diff), H1–H3 outline, links (href + text) in main, header and footer, image count and alt text, robots meta (noindex), full-page screenshots at 1440px and 390px, and the header at scroll 0 with no hover (1440px, 390px, 390px with the menu open, and 1440px after client-side navigation from /), where every header link and button must reach ${minHeaderContrast}:1 contrast against the pixels behind it. Allowlisted differences carry their reason from <code>scripts/compare-live.allowlist.ts</code>. Console and network errors are collected on the local production build at 1440px and 390px.</p>
${renderErrorSummary(results)}
<table><thead><tr><th>Page</th><th>Status</th><th>Unexplained</th><th>Allowlisted</th><th>Errors</th></tr></thead><tbody>${rows}</tbody></table>
${compared.map(renderPage).join("")}
<section id="new-copy-review">
  <h2>NEW: copy review</h2>
  <p>These pages are not on the live site. Text is the visible main content after FAQ answers are expanded. Screenshots are the full page at scroll 0 with no hover. Header contrast uses the same scroll-0, no-hover checks as the migrated pages. Each page is indexable.</p>
  <table><thead><tr><th>Page</th><th>Words</th><th>Status</th><th>Errors</th></tr></thead><tbody>${newRows}</tbody></table>
  ${fresh.map(renderNewPage).join("")}
</section>
</body></html>`
}

// ---------- server + main ----------

async function waitFor(url: string, timeoutMs: number) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function startServer(): ChildProcess {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next")
  return spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: root,
    stdio: "ignore",
  })
}

async function sitemapPaths() {
  const xml = await (await fetch(`${localOrigin}/sitemap.xml`)).text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => normalizeHref(match[1] ?? ""))
}

async function pool<T, R>(items: T[], size: number, run: (item: T) => Promise<R>) {
  const results: R[] = []
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next]
        next += 1
        results.push(await run(item))
      }
    }),
  )
  return results
}

async function main() {
  const args = process.argv.slice(2)
  const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length).split(",")
  const shots = !args.includes("--no-shots")
  if (!existsSync(path.join(root, ".next", "BUILD_ID"))) {
    throw new Error("No production build found. Run `npm run build` first.")
  }
  mkdirSync(shotsDir, { recursive: true })

  const server = startServer()
  try {
    await waitFor(`${localOrigin}/`, 60000)
    const paths = only ?? [...new Set([...requestedPages, ...(await sitemapPaths())])].sort()
    const reviewPaths = (only ? newPages.filter((pagePath) => only.includes(pagePath)) : newPages).filter(
      (pagePath) => !paths.includes(pagePath),
    )
    const jobs = [
      ...paths.map((pagePath) => ({ pagePath, kind: "compare" as const })),
      ...reviewPaths.map((pagePath) => ({ pagePath, kind: "new" as const })),
    ]
    const browser = await chromium.launch()
    try {
      let done = 0
      const fresh = await pool(jobs, concurrency, async (job) => {
        const result =
          job.kind === "new"
            ? await reviewNewPage(browser, job.pagePath, shots)
            : await comparePage(browser, job.pagePath, shots)
        done += 1
        const mustFix = (result.errors ?? []).filter((issue) => classifyIssue(issue).classification === "MUST FIX").length
        console.log(
          `[${done}/${jobs.length}] ${result.status.padEnd(12)} ${job.pagePath}${mustFix ? `  MUST FIX ${mustFix}` : ""}`,
        )
        return result
      })
      const placeholderHrefs: string[] = []
      await pool(
        jobs.map((job) => job.pagePath),
        concurrency,
        async (pagePath) => {
          const html = await (await fetch(`${localOrigin}${pagePath}`)).text()
          if (/href=(["'])#\1/.test(html)) placeholderHrefs.push(pagePath)
          return pagePath
        },
      )
      const jsonFile = path.join(reportDir, "report.json")
      const keepShots = !shots && existsSync(jsonFile)
      const previous: PageResult[] =
        (only || keepShots) && existsSync(jsonFile) ? JSON.parse(readFileSync(jsonFile, "utf8")) : []
      const merged = new Map(previous.map((result) => [result.path, result]))
      for (const result of fresh) {
        const old = merged.get(result.path)
        merged.set(result.path, shots || !old ? result : { ...result, shots: old.shots })
      }
      const results = [...merged.values()]
      writeFileSync(jsonFile, JSON.stringify(results, null, 2))
      writeFileSync(path.join(reportDir, "index.html"), renderReport(results, placeholderHrefs.sort()))
      const compared = results.filter((result) => result.mode !== "new")
      const pass = compared.filter((result) => result.status === "PASS").length
      console.log(
        `\n${pass}/${compared.length} PASS. ${results.length - compared.length} new pages in copy review. Report: ${path.join(reportDir, "index.html")}`,
      )
      console.log(
        placeholderHrefs.length
          ? `href="#" still present on: ${placeholderHrefs.sort().join(", ")}`
          : 'No href="#" in local HTML.',
      )
      const groups = groupErrors(results)
      const mustGroups = groups.filter((group) => group.classification === "MUST FIX")
      console.log(`\nErrors: ${mustGroups.length} MUST FIX, ${groups.length - mustGroups.length} OK.`)
      for (const group of groups) {
        const line = group.message.split("\n")[0]?.slice(0, 240) ?? ""
        console.log(`${group.classification} (${group.reason}) [${group.kind}] ${line}`)
        if (group.source) console.log(`  ${group.source}`)
        console.log(`  ${group.pages.map((page) => `${page.path} [${page.widths.join(", ")}]`).join(", ")}`)
      }
    } finally {
      await browser.close()
    }
  } finally {
    server.kill()
  }
}

await main()
