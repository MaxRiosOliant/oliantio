// Converts the Webflow article export into content/articles/*.md,
// content/authors/*.md, and files under public/images.
// Author fields live on each article row; _migration has no authors CSV.
//
// node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/migrate-articles.ts

import { spawn } from "node:child_process"
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import * as domino from "@mixmark-io/domino"
import TurndownService from "turndown"

import { articleSchema, authorSchema } from "../lib/content/schemas.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const migrationDir = path.join(root, "_migration")
const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"])
const extensionsByType: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
}
const knownTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
])

type Row = Record<string, string>

type Downloaded = {
  bytes: Buffer
  contentType: string
}

type PendingWrite = {
  path: string
  data: Buffer | string
}

type Seo = {
  title?: string
  description?: string
  noindex: boolean
}

type Turndown = {
  turndown: (html: string) => string
  remove: (elements: string[]) => void
}

const downloadCache = new Map<string, Promise<Downloaded>>()

export function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
          continue
        }
        inQuotes = false
        continue
      }
      field += character
      continue
    }
    if (character === '"') {
      inQuotes = true
      continue
    }
    if (character === ",") {
      row.push(field)
      field = ""
      continue
    }
    if (character === "\r") continue
    if (character === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      continue
    }
    field += character
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const headers = (rows[0] ?? []).map((header) => header.replace(/^\uFEFF/, ""))
  return rows
    .slice(1)
    .filter((record) => record.some((value) => value !== ""))
    .map((record) =>
      Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
    )
}

export function findExport(prefix: string) {
  return readdir(migrationDir).then((names) => {
    const matches = names.filter((name) => name.startsWith(prefix) && name.endsWith(".csv"))
    if (matches.length !== 1) {
      throw new Error(`Expected one ${prefix} CSV in _migration, found ${matches.length}`)
    }
    return path.join(migrationDir, matches[0] ?? "")
  })
}

export function flagged(value: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === "true") return true
  if (normalized === "false" || normalized === "") return false
  throw new Error(`Expected true or false, received ${JSON.stringify(value)}`)
}

function calendarDate(value: string) {
  const date = new Date(value)
  if (!value.trim() || Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date ${JSON.stringify(value)}`)
  }
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Cannot slugify ${JSON.stringify(value)}`)
  }
  return slug
}

export function yamlString(value: string) {
  if (
    value.length === 0 ||
    /[:#&*!|>%@`'"\\{}\[\],?\n\r]/.test(value) ||
    /^\s|\s$/.test(value) ||
    /^(?:true|false|null|yes|no|~|n|y)$/i.test(value) ||
    /^[-?0-9]/.test(value)
  ) {
    return JSON.stringify(value)
  }
  return value
}

export function decodeEntities(value: string) {
  let current = value
  for (let pass = 0; pass < 2; pass += 1) {
    current = current
      .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
        String.fromCodePoint(Number.parseInt(code, 16)),
      )
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
  }
  return current
}

export function plainText(value: string) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  const ranked = [...counts.entries()].sort(
    (left, right) => right[1] - left[1] || right[0].length - left[0].length,
  )
  return ranked[0]?.[0] ?? ""
}

function articleSlug(address: string) {
  let url: URL
  try {
    url = new URL(address)
  } catch {
    return null
  }
  const parts = url.pathname.split("/").filter(Boolean)
  if (parts.length !== 2 || parts[0] !== "articles") return null
  return decodeURIComponent(parts[1] ?? "")
}

function crawlSeo(rows: Row[]) {
  const seo = new Map<string, Seo>()
  for (const row of rows) {
    const slug = articleSlug(row.Address ?? "")
    if (!slug) continue
    const next: Seo = {
      ...(row["Title 1"]?.trim() ? { title: row["Title 1"].trim() } : {}),
      ...(row["Meta Description 1"]?.trim()
        ? { description: row["Meta Description 1"].trim() }
        : {}),
      noindex: /noindex/i.test(
        `${row["Meta Robots 1"] ?? ""} ${row["X-Robots-Tag 1"] ?? ""} ${row["Indexability Status"] ?? ""}`,
      ),
    }
    const current = seo.get(slug)
    if (
      current &&
      (current.title !== next.title ||
        current.description !== next.description ||
        current.noindex !== next.noindex)
    ) {
      throw new Error(`Conflicting crawl SEO for ${slug}`)
    }
    seo.set(slug, next)
  }
  return seo
}

function seoFor(row: Row, seoBySlug: Map<string, Seo>, draft: boolean) {
  const crawled = seoBySlug.get(row.Slug ?? "")
  if (crawled) return crawled
  if (!draft) {
    throw new Error("No crawl SEO for this article")
  }
  const title = row["Meta Title"]?.trim() ?? ""
  const description = row["Meta Description"]?.trim() ?? ""
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    noindex: true,
  }
}

function absoluteUrl(value: string) {
  const url = decodeEntities(value).trim()
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`Unsupported image URL ${JSON.stringify(value)}`)
  }
  return url
}

function extensionFromUrl(url: string) {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname)
    const match = /\.([a-z0-9]+)$/i.exec(pathname)
    const extension = match?.[1]?.toLowerCase() ?? ""
    return imageExtensions.has(extension) ? extension : null
  } catch {
    return null
  }
}

function extensionFromType(contentType: string) {
  return extensionsByType[contentType] ?? null
}

function alternateUrl(url: string) {
  try {
    const parsed = new URL(url)
    const decoded = decodeURIComponent(parsed.pathname)
    if (decoded === parsed.pathname) return null
    parsed.pathname = decoded
    return parsed.href === url ? null : parsed.href
  } catch {
    return null
  }
}

function runCurl(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("curl.exe", args, { windowsHide: true })
    let stderr = ""
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(stderr.trim() || `curl exited ${code}`))
    })
  })
}

async function request(url: string) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "oliant-image-"))
  const file = path.join(directory, "image")
  const headers = path.join(directory, "headers")
  try {
    await runCurl([
      "--fail",
      "--location",
      "--silent",
      "--show-error",
      "--retry",
      "2",
      "--max-time",
      "30",
      "--referer",
      "https://www.oliant.io/",
      "--dump-header",
      headers,
      "--output",
      file,
      "--url",
      url,
    ])
    const bytes = await readFile(file)
    const headerText = await readFile(headers, "utf8")
    const types = [...headerText.matchAll(/^content-type:\s*([^;\r\n]+)/gim)]
    const contentType = types.at(-1)?.[1]?.trim().toLowerCase() ?? ""
    const allowed =
      contentType.length === 0 ||
      contentType.startsWith("image/") ||
      contentType === "application/octet-stream" ||
      contentType === "binary/octet-stream"
    if (!allowed) {
      throw new Error(`${contentType} for ${url}`)
    }
    if (bytes.length === 0) {
      throw new Error(`Empty image for ${url}`)
    }
    return { bytes, contentType }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

function download(url: string) {
  const cached = downloadCache.get(url)
  if (cached) return cached

  const pending = (async () => {
    try {
      return await request(url)
    } catch (error) {
      const alternate = alternateUrl(url)
      if (!alternate) throw error
      return request(alternate)
    }
  })().catch((error: unknown) => {
    downloadCache.delete(url)
    throw error
  })

  downloadCache.set(url, pending)
  return pending
}

function preprocess(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<head\b[\s\S]*?<\/head>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(?:html|body)\b[^>]*>/gi, "")
    .replace(/<(strong|em|b|i)\b[^>]*>(\s*)<\/\1>/gi, "$2")
    .replace(/&nbsp;|&#160;|&#xa0;/gi, " ")
    .replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, " ")
}

function preserveLiteralTags(html: string) {
  return html.replace(/<(\/?[a-zA-Z][^>\s]*)/g, (match, rawName: string) => {
    const name = rawName.replace(/^\//, "").split(/[^a-zA-Z0-9-]/)[0]?.toLowerCase() ?? ""
    if (knownTags.has(name) && /^\/?[a-zA-Z][a-zA-Z0-9-]*$/.test(rawName)) return match
    return `&lt;${rawName}`
  })
}

type HtmlNode = {
  innerHTML?: string
  textContent: string | null
  parentNode: { replaceChild: (next: HtmlNode, current: HtmlNode) => void } | null
  getAttribute: (name: string) => string | null
}

type HtmlElement = HtmlNode & {
  nodeType: number
  tagName?: string
  innerHTML: string
  childNodes: ArrayLike<HtmlElement>
  getElementsByTagName: (name: string) => ArrayLike<HtmlElement>
  setAttribute: (name: string, value: string) => void
  appendChild: (node: HtmlElement) => void
  removeChild: (node: HtmlElement) => void
}

type HtmlDocument = {
  createElement: (name: string) => HtmlElement
  createTextNode: (value: string) => HtmlElement
  getElementsByTagName: (name: string) => { length: number; [index: number]: HtmlElement }
  getElementById: (id: string) => HtmlElement | null
}

function createHtmlDocument(html: string) {
  const dominoModule = domino as unknown as {
    createDocument?: (value: string) => HtmlDocument
    default?: { createDocument?: (value: string) => HtmlDocument }
  }
  const createDocument = dominoModule.createDocument ?? dominoModule.default?.createDocument
  if (!createDocument) {
    throw new Error("Could not load the HTML parser used by turndown")
  }
  return createDocument(html)
}

function elementChildren(node: HtmlElement) {
  return Array.from(node.childNodes).filter((child) => child.nodeType === 1)
}

function hasText(node: HtmlElement) {
  return Array.from(node.childNodes).some(
    (child) => child.nodeType === 3 && (child.textContent ?? "").trim() !== "",
  )
}

function unwrapSoleEmphasis(heading: HtmlElement) {
  const elements = elementChildren(heading)
  const only = elements[0]
  if (
    elements.length !== 1 ||
    !only ||
    !/^(strong|b)$/i.test(only.tagName ?? "") ||
    hasText(heading)
  ) {
    return
  }
  heading.innerHTML = only.innerHTML
}

function simplifyCallout(heading: HtmlElement, document: HtmlDocument) {
  const text = (heading.textContent ?? "").replace(/\s+/g, " ").trim()
  if (!/also check/i.test(text)) return
  const anchors = Array.from(heading.getElementsByTagName("a"))
  if (anchors.length !== 1) return
  const anchor = anchors[0]
  const href = anchor?.getAttribute("href")
  const linkText = (anchor?.textContent ?? "").replace(/\s+/g, " ").trim()
  if (!anchor || !href || !linkText || !text.includes(linkText)) return
  const before = text
    .slice(0, text.indexOf(linkText))
    .replace(/\s+/g, " ")
    .replace(/^\s+/, "")
  const after = text
    .slice(text.indexOf(linkText) + linkText.length)
    .replace(/\s+/g, " ")
    .replace(/\s+$/, "")
  const beforeText = before.length === 0 || before.endsWith(" ") ? before : `${before} `
  const afterText = after.length === 0 || after.startsWith(" ") ? after : ` ${after}`
  heading.innerHTML = ""
  if (beforeText) heading.appendChild(document.createTextNode(beforeText))
  const link = document.createElement("a")
  link.setAttribute("href", href)
  link.appendChild(document.createTextNode(linkText))
  heading.appendChild(link)
  if (afterText) heading.appendChild(document.createTextNode(afterText))
}

function stripTrailingBreaks(item: HtmlElement) {
  const children = Array.from(item.childNodes)
  for (let index = children.length - 1; index >= 0; index -= 1) {
    const child = children[index]
    if (!child) break
    if (child.nodeType === 1 && /^br$/i.test(child.tagName ?? "")) {
      item.removeChild(child)
      continue
    }
    if (child.nodeType === 3 && !(child.textContent ?? "").trim()) {
      item.removeChild(child)
      continue
    }
    break
  }
}

function normalizeRichText(html: string) {
  const document = createHtmlDocument(`<div id="oliant-root">${html}</div>`)
  const root = document.getElementById("oliant-root")
  if (!root) return html
  for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    for (const heading of Array.from(root.getElementsByTagName(tag))) {
      unwrapSoleEmphasis(heading)
      simplifyCallout(heading, document)
    }
  }
  for (const item of Array.from(root.getElementsByTagName("li"))) {
    stripTrailingBreaks(item)
  }
  return root.innerHTML
}

function repairAnchors(html: string) {
  const document = createHtmlDocument(`<body>${html}</body>`)
  const anchors = document.getElementsByTagName("a")
  const nodes = Array.from({ length: anchors.length }, (_, index) => anchors[index]).filter(
    (node): node is HtmlNode => Boolean(node),
  )
  for (const anchor of nodes) {
    const href = decodeEntities(anchor.getAttribute("href") ?? "").trim()
    if (/^https?:\/\/\S+$/i.test(href) && href.length < 400) continue
    const urls = [...href.matchAll(/https?:\/\/[^\s<>"')]+/g)].map((match) => match[0])
    const words = (anchor.textContent ?? "").toLowerCase().match(/[a-z]{3,}/g) ?? []
    const related = urls.find(
      (url) =>
        url.startsWith("https://") && words.some((word) => url.toLowerCase().includes(word)),
    )
    const label = anchor.textContent ?? ""
    const text = related && !label.includes(related) ? `${label} (${related})` : label
    anchor.parentNode?.replaceChild(document.createTextNode(text), anchor)
  }
  return document.getElementsByTagName("body")[0]?.innerHTML ?? html
}

function imageSources(html: string) {
  const sources: string[] = []
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = /\bsrc\s*=\s*(["'])([\s\S]*?)\1/i.exec(match[0])
    if (!src?.[2]) {
      throw new Error(`Image is missing src: ${match[0].slice(0, 140)}`)
    }
    sources.push(absoluteUrl(src[2]))
  }
  return sources
}

function rewriteImages(html: string, localPath: (url: string) => string) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = /\bsrc\s*=\s*(["'])([\s\S]*?)\1/i.exec(tag)
    if (!srcMatch?.[2]) {
      throw new Error(`Image is missing src: ${tag.slice(0, 140)}`)
    }
    const local = localPath(absoluteUrl(srcMatch[2]))
    const withAlt = tag.replace(
      /\balt\s*=\s*(["'])([\s\S]*?)\1/i,
      (_match, _quote: string, alt: string) => {
        const decoded = decodeEntities(alt).replace(/\s+/g, " ").trim()
        if (!decoded || decoded === "__wf_reserved_inherit") return 'alt=""'
        const escaped = decoded
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
        return `alt="${escaped}"`
      },
    )
    return withAlt.replace(srcMatch[0], `src="${local}"`)
  })
}

function inlineCell(html: string, turndown: Turndown) {
  return turndown
    .turndown(html)
    .replace(/\n+/g, " ")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim()
}

function parseRows(html: string, turndown: Turndown) {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) =>
      inlineCell(cell[1] ?? "", turndown),
    ),
  )
}

function tableToMarkdown(tableHtml: string, turndown: Turndown) {
  const thead = /<thead\b[^>]*>([\s\S]*?)<\/thead>/i.exec(tableHtml)?.[1]
  const tbody = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i.exec(tableHtml)?.[1]
  const headerRows = thead ? parseRows(thead, turndown) : []
  let bodyRows = parseRows(tbody ?? tableHtml, turndown)
  if (thead && !tbody) bodyRows = bodyRows.slice(headerRows.length)
  const header = headerRows[0] ?? bodyRows.shift() ?? []
  if (header.length === 0) {
    throw new Error("Table has no rows")
  }
  const width = Math.max(header.length, ...bodyRows.map((row) => row.length))
  const pad = (row: string[]) =>
    Array.from({ length: width }, (_unused, index) => row[index] ?? "")
  const line = (row: string[]) => `| ${pad(row).join(" | ")} |`
  return [
    line(header),
    `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
    ...bodyRows.map((row) => line(row)),
  ].join("\n")
}

function replaceTables(html: string, turndown: Turndown) {
  const tables: string[] = []
  const next = html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => {
    tables.push(tableToMarkdown(table, turndown))
    return `<p>OLIANTTABLE${tables.length - 1}PLACEHOLDER</p>`
  })
  return { html: next, tables }
}

function tidy(markdown: string) {
  return `${markdown
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`
}

function createTurndown() {
  const exported = TurndownService as unknown as {
    default?: new (options: Record<string, string>) => Turndown
  }
  const Service =
    typeof TurndownService === "function"
      ? (TurndownService as unknown as new (options: Record<string, string>) => Turndown)
      : exported.default
  if (!Service) {
    throw new Error("Could not load turndown. Install it with npm install -D turndown")
  }
  const turndown = new Service({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
  })
  turndown.remove(["style", "script", "head", "title", "meta", "noscript"])
  return turndown
}

function uniqueFilename(url: string, extension: string, used: Set<string>) {
  const pathname = decodeURIComponent(new URL(url).pathname)
  const base = pathname.split("/").pop() ?? "image"
  const stem =
    base
      .replace(/\.[a-z0-9]+$/i, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  let filename = `${stem}.${extension}`
  let suffix = 2
  while (used.has(filename)) {
    filename = `${stem}-${suffix}.${extension}`
    suffix += 1
  }
  used.add(filename)
  return filename
}

function documentFor(lines: string[], body: string) {
  const normalized = body.endsWith("\n") || body.length === 0 ? body : `${body}\n`
  return `---\n${lines.join("\n")}\n---\n\n${normalized}`
}

function issues(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues
    .map((issue) => `${issue.path.map(String).join(".")}: ${issue.message}`)
    .join("; ")
}

function assertInside(file: string) {
  const relative = path.relative(root, file)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write ${file}`)
  }
}

async function main() {
  const articlesPath = await findExport("Oliant - Articles")
  const [articleRows, crawlRows, categoryNames] = await Promise.all([
    readFile(articlesPath, "utf8").then(parseCsv),
    readFile(path.join(migrationDir, "crawl-pages.csv"), "utf8").then(parseCsv),
    readdir(path.join(root, "content", "categories")),
  ])
  console.log(`Reading ${path.relative(root, articlesPath)}`)

  const categories = new Set(
    categoryNames
      .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
      .map((name) => name.replace(/\.mdx?$/, "")),
  )
  const seoBySlug = crawlSeo(crawlRows)
  const turndown = createTurndown()
  const imported: Row[] = []
  let archived = 0

  for (const row of articleRows) {
    const slug = row.Slug?.trim() ?? ""
    if (!slug) continue
    if (flagged(row.Archived ?? "")) {
      archived += 1
      continue
    }
    imported.push(row)
  }

  const authorRows = new Map<string, Row[]>()
  for (const row of imported) {
    const name = plainText(row["Author Name"] ?? "")
    if (!name) throw new Error(`${row.Slug}: missing author name`)
    const slug = slugify(name)
    const group = authorRows.get(slug) ?? []
    group.push(row)
    authorRows.set(slug, group)
  }

  const writes: PendingWrite[] = []
  const authorSlugs = new Set<string>()

  for (const [slug, rows] of authorRows) {
    const name = plainText(rows[0]?.["Author Name"] ?? "")
    const bio = mostCommon(rows.map((row) => plainText(row["Author Descriptions"] ?? "")))
    const imageUrl = mostCommon(
      rows.map((row) => row["Author Image"]?.trim() ?? "").filter(Boolean),
    )
    let avatar: string | undefined
    if (imageUrl) {
      const absolute = absoluteUrl(imageUrl)
      const downloaded = await download(absolute)
      const extension = extensionFromUrl(absolute) ?? extensionFromType(downloaded.contentType)
      if (!extension) throw new Error(`${slug}: author image has no extension`)
      avatar = `/images/authors/${slug}/avatar.${extension}`
      writes.push({
        path: path.join(root, "public", "images", "authors", slug, `avatar.${extension}`),
        data: downloaded.bytes,
      })
    }

    const author = { name, slug, ...(avatar ? { avatar } : {}) }
    const parsed = authorSchema.safeParse(author)
    if (!parsed.success) {
      throw new Error(`content/authors/${slug}.md ${issues(parsed.error)}`)
    }
    authorSlugs.add(slug)
    writes.push({
      path: path.join(root, "content", "authors", `${slug}.md`),
      data: documentFor(
        [
          `name: ${yamlString(name)}`,
          `slug: ${slug}`,
          ...(avatar ? [`avatar: ${avatar}`] : []),
        ],
        bio,
      ),
    })
  }

  let drafts = 0
  for (const row of imported) {
    const slug = row.Slug?.trim() ?? ""
    try {
      const draft = flagged(row.Draft ?? "")
      if (draft) drafts += 1
      const title = plainText(row.Title ?? "")
      const excerpt = plainText(row.Description ?? "")
      const category = (row.Tag ?? "").trim()
      const author = slugify(plainText(row["Author Name"] ?? ""))
      const date = calendarDate(row["Special date"] ?? "")
      const updatedOn = calendarDate(row["Updated On"] ?? "")
      const updated = updatedOn === date ? undefined : updatedOn
      const seo = seoFor(row, seoBySlug, draft)
      if (!categories.has(category)) {
        throw new Error(`category "${category}" does not match a categories document`)
      }
      if (!authorSlugs.has(author)) {
        throw new Error(`author "${author}" was not created`)
      }

      const coverUrl = absoluteUrl(row["Large Cover Image"] ?? "")
      const html = repairAnchors(
        normalizeRichText(preserveLiteralTags(preprocess(row["Full Article"] ?? ""))),
      )
      if (!html.trim()) throw new Error("Article body is empty")
      const inlineUrls = imageSources(html)
      const downloaded = new Map<string, Downloaded>()
      for (const url of [coverUrl, ...inlineUrls]) {
        if (!downloaded.has(url)) downloaded.set(url, await download(url))
      }

      const used = new Set<string>()
      const localByUrl = new Map<string, string>()
      const coverExtension =
        extensionFromUrl(coverUrl) ?? extensionFromType(downloaded.get(coverUrl)?.contentType ?? "")
      if (!coverExtension) throw new Error("Cover image has no extension")
      const coverFile = `cover.${coverExtension}`
      used.add(coverFile)
      const coverSrc = `/images/articles/${slug}/${coverFile}`
      localByUrl.set(coverUrl, coverSrc)
      const coverDownload = downloaded.get(coverUrl)
      if (!coverDownload) throw new Error("Missing cover download")
      writes.push({
        path: path.join(root, "public", "images", "articles", slug, coverFile),
        data: coverDownload.bytes,
      })

      for (const url of inlineUrls) {
        if (localByUrl.has(url)) continue
        const file = downloaded.get(url)
        const extension = extensionFromUrl(url) ?? extensionFromType(file?.contentType ?? "")
        if (!extension || !file) throw new Error(`Inline image has no extension: ${url}`)
        const filename = uniqueFilename(url, extension, used)
        localByUrl.set(url, `/images/articles/${slug}/${filename}`)
        writes.push({
          path: path.join(root, "public", "images", "articles", slug, filename),
          data: file.bytes,
        })
      }

      const localized = rewriteImages(html, (url) => {
        const local = localByUrl.get(url)
        if (!local) throw new Error(`Missing local path for ${url}`)
        return local
      })
      const tables = replaceTables(localized, turndown)
      let markdown = turndown.turndown(tables.html)
      for (let index = 0; index < tables.tables.length; index += 1) {
        const token = `OLIANTTABLE${index}PLACEHOLDER`
        if (!markdown.includes(token)) throw new Error(`Lost table ${index}`)
        markdown = markdown.replace(token, `\n\n${tables.tables[index]}\n\n`)
      }
      markdown = tidy(markdown)
      if (
        /https?:\/\/cdn\.prod\.website-files\.com\/\S+\.(?:png|jpe?g|gif|webp|avif|svg)/i.test(
          markdown,
        )
      ) {
        throw new Error("Markdown still references a Webflow CDN image")
      }

      const coverAlt = plainText(row["Images Alt text"] ?? "")
      const article = {
        title,
        slug,
        date,
        ...(updated ? { updated } : {}),
        author,
        category,
        excerpt,
        coverImage: {
          src: coverSrc,
          alt: coverAlt && coverAlt !== "__wf_reserved_inherit" ? coverAlt : title,
        },
        draft,
        seo,
      }
      const parsed = articleSchema.safeParse(article)
      if (!parsed.success) {
        throw new Error(issues(parsed.error))
      }

      const lines = [
        `title: ${yamlString(title)}`,
        `slug: ${slug}`,
        `date: ${date}`,
        ...(updated ? [`updated: ${updated}`] : []),
        `author: ${author}`,
        `category: ${category}`,
        `excerpt: ${yamlString(excerpt)}`,
        "coverImage:",
        `  src: ${coverSrc}`,
        `  alt: ${yamlString(article.coverImage.alt)}`,
        `draft: ${draft}`,
        "seo:",
        ...(seo.title ? [`  title: ${yamlString(seo.title)}`] : []),
        ...(seo.description ? [`  description: ${yamlString(seo.description)}`] : []),
        `  noindex: ${seo.noindex}`,
      ]
      writes.push({
        path: path.join(root, "content", "articles", `${slug}.md`),
        data: documentFor(lines, markdown),
      })
      console.log(slug)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`${slug}: ${message}`)
    }
  }

  const seen = new Map<string, Buffer | string>()
  for (const write of writes) {
    assertInside(write.path)
    const previous = seen.get(write.path)
    if (previous !== undefined) {
      const same =
        typeof previous === "string" && typeof write.data === "string"
          ? previous === write.data
          : Buffer.isBuffer(previous) &&
            Buffer.isBuffer(write.data) &&
            previous.equals(write.data)
      if (!same) throw new Error(`Conflicting writes for ${write.path}`)
      continue
    }
    seen.set(write.path, write.data)
  }

  const directories = new Set([...seen.keys()].map((file) => path.dirname(file)))
  await Promise.all([...directories].map((directory) => mkdir(directory, { recursive: true })))
  await Promise.all(
    [...seen.entries()].map(([file, data]) => writeFile(file, data)),
  )

  const writtenSlugs = new Set(
    [...seen.keys()]
      .filter((file) => file.includes(`${path.sep}content${path.sep}articles${path.sep}`))
      .map((file) => path.basename(file, ".md")),
  )
  const crawled = [...seoBySlug.keys()]
  const missing = crawled.filter((slug) => !writtenSlugs.has(slug))
  const imageCount = [...seen.keys()].filter((file) =>
    file.includes(`${path.sep}public${path.sep}images${path.sep}`),
  ).length

  console.log("")
  console.log(
    `Imported ${imported.length} articles (${drafts} drafts). Skipped ${archived} archived.`,
  )
  console.log(`Wrote ${authorSlugs.size} authors and ${imageCount} images.`)
  if (missing.length > 0) {
    console.log("Missing article files for crawled URLs:")
    for (const slug of missing) console.log(`  /articles/${slug}`)
    process.exitCode = 1
    return
  }
  console.log("Every crawled /articles/ URL has a file.")
}

const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
