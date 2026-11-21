// Compares every migrated page against the live site and writes
// _migration/report/index.html (plus report.json).
//
// Requires a production build (npm run build). The script starts `next start`
// on port 3100 itself.
//
// node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/compare-live.ts [--only=/a,/b] [--no-shots]
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
  links: Record<Region, string[]>
  images: string[]
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

type PageResult = {
  path: string
  status: "PASS" | "NEEDS REVIEW"
  error?: string
  liveStatus?: number
  localStatus?: number
  text: TextHunk[]
  items: ItemDiff[]
  counts: { liveImages: number; localImages: number }
  imageFiles?: { live: string[]; local: string[] }
  shots: string[]
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

    return { words, headings, links, images }
  }, side)
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
      },
      imageFiles: raw.images.map((image) => image.file),
      shotFiles,
    }
  } finally {
    await context.close()
  }
}

function slugFor(pagePath: string) {
  return pagePath === "/" ? "index" : pagePath.slice(1).replace(/\//g, "__")
}

async function comparePage(browser: Browser, pagePath: string, shots: boolean): Promise<PageResult> {
  try {
    const [live, local] = await Promise.all([
      capture(browser, "live", pagePath, shots),
      capture(browser, "local", pagePath, shots),
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
      shots: [...live.shotFiles, ...local.shotFiles],
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
  return `
  <section id="${id}">
    <h2><span class="badge ${result.status === "PASS" ? "pass" : "review"}">${result.status}</span>
      <a href="${liveOrigin}${result.path}">${escapeHtml(result.path)}</a></h2>
    <p class="meta">HTTP live ${result.liveStatus ?? "?"} / local ${result.localStatus ?? "?"} ·
      images live ${result.counts.liveImages} / local ${result.counts.localImages} ·
      ${open} unexplained, ${allowed} allowlisted</p>
    ${result.error ? `<p class="error">${escapeHtml(result.error)}</p>` : ""}
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
  </section>`
}

function renderReport(results: PageResult[]) {
  const sorted = [...results].sort((a, b) => a.path.localeCompare(b.path))
  const pass = sorted.filter((result) => result.status === "PASS").length
  const rows = sorted
    .map((result) => {
      const open = result.text.filter((hunk) => !hunk.reason).length + result.items.filter((diff) => !diff.reason).length
      const allowed = result.text.filter((hunk) => hunk.reason).length + result.items.filter((diff) => diff.reason).length
      return `<tr><td><a href="#${slugFor(result.path)}">${escapeHtml(result.path)}</a></td>
        <td><span class="badge ${result.status === "PASS" ? "pass" : "review"}">${result.status}</span></td>
        <td>${open}</td><td>${allowed}</td></tr>`
    })
    .join("")
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Live vs local comparison</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font: 14px/1.5 system-ui, sans-serif; margin: 2rem; color: #201e28; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: .35rem .5rem; text-align: left; vertical-align: top; }
  .badge { display: inline-block; padding: .1rem .5rem; border-radius: .25rem; font-size: 12px; font-weight: 700; }
  .pass { background: #d7f5d0; color: #1e5c12; } .review { background: #ffe1d6; color: #8a2a00; }
  section { border-top: 2px solid #201e28; margin-top: 2.5rem; padding-top: 1rem; }
  tr.allowed { color: #777; } tr.open { background: #fff7f3; }
  del { background: #ffd7d7; text-decoration: line-through; } ins { background: #d7ffd9; text-decoration: none; }
  .ctx { color: #999; } .meta { color: #555; } .error { color: #b00; font-weight: 700; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
  .pair.w390 { grid-template-columns: repeat(2, minmax(0, 390px)); }
  figure { margin: 0; max-height: 1600px; overflow: auto; border: 1px solid #ccc; }
  figcaption { position: sticky; top: 0; background: #fff; padding: .25rem .5rem; font-weight: 600; }
  figure img { width: 100%; display: block; }
</style></head><body>
<h1>Live vs local comparison</h1>
<p>Generated ${new Date().toISOString()} · ${pass}/${sorted.length} PASS · live ${liveOrigin} vs local production build (next start).</p>
<p>Checks per page: normalized visible main-content text (word diff), H1–H3 outline, links (href + text) in main, header and footer, image count and alt text, and full-page screenshots at 1440px and 390px. Allowlisted differences carry their reason from <code>scripts/compare-live.allowlist.ts</code>.</p>
<table><thead><tr><th>Page</th><th>Status</th><th>Unexplained</th><th>Allowlisted</th></tr></thead><tbody>${rows}</tbody></table>
${sorted.map(renderPage).join("")}
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
    const browser = await chromium.launch()
    try {
      let done = 0
      const fresh = await pool(paths, concurrency, async (pagePath) => {
        const result = await comparePage(browser, pagePath, shots)
        done += 1
        console.log(`[${done}/${paths.length}] ${result.status.padEnd(12)} ${pagePath}`)
        return result
      })
      const jsonFile = path.join(reportDir, "report.json")
      const previous: PageResult[] =
        only && existsSync(jsonFile) ? JSON.parse(readFileSync(jsonFile, "utf8")) : []
      const merged = new Map(previous.map((result) => [result.path, result]))
      for (const result of fresh) {
        const old = merged.get(result.path)
        merged.set(result.path, shots || !old ? result : { ...result, shots: old.shots })
      }
      const results = [...merged.values()]
      writeFileSync(jsonFile, JSON.stringify(results, null, 2))
      writeFileSync(path.join(reportDir, "index.html"), renderReport(results))
      const pass = results.filter((result) => result.status === "PASS").length
      console.log(`\n${pass}/${results.length} PASS. Report: ${path.join(reportDir, "index.html")}`)
    } finally {
      await browser.close()
    }
  } finally {
    server.kill()
  }
}

await main()
