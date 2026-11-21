// Restores article code blocks. The Webflow CSV export leaves every code block
// as an empty <pre></pre>, so the code is read from the live article and
// inserted as a fenced block after the text that precedes it in the export.
// Articles that already contain fenced code are skipped.
//
// node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/migrate-article-code.ts

import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

import { findExport, parseCsv, plainText } from "./migrate-articles.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const liveOrigin = "https://www.oliant.io"

function normalize(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function markdownPlain(line: string) {
  return normalize(
    line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^\s*(?:[-*]|\d+\.)\s+/, "")
      .replace(/^#+\s+/, "")
      .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, "$1")
      .replace(/[*_`]/g, ""),
  )
}

// Plain text of the export HTML before each <pre>, used to place the block.
function anchors(html: string) {
  const result: Array<{ anchor: string; empty: boolean }> = []
  for (const match of html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)) {
    const before = normalize(plainText(html.slice(0, match.index)))
    result.push({
      anchor: before.slice(-40),
      empty: !plainText(match[1] ?? ""),
    })
  }
  return result
}

async function liveCode(slug: string) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(`${liveOrigin}/articles/${slug}`, { waitUntil: "networkidle", timeout: 90000 })
    return await page.$$eval(".article_content pre", (pres) =>
      pres.map((pre) => {
        const code = pre.querySelector("code")
        const language = /language-([\w+-]+)/.exec(code?.className ?? pre.className)?.[1] ?? ""
        return { text: (code ?? pre).textContent ?? "", language }
      }),
    )
  } finally {
    await browser.close()
  }
}

async function main() {
  const rows = parseCsv(await readFile(await findExport("Oliant - Articles"), "utf8"))
  for (const row of rows) {
    const placements = anchors(row["Full Article"] ?? "")
    if (!placements.some((placement) => placement.empty)) continue
    const file = path.join(root, "content", "articles", `${row.Slug}.md`)
    const source = await readFile(file, "utf8")
    if (/^```/m.test(source)) {
      console.log(`${row.Slug}: already has code blocks, skipped`)
      continue
    }
    const code = await liveCode(row.Slug ?? "")
    if (code.length !== placements.length) {
      throw new Error(`${row.Slug}: live has ${code.length} code blocks, export has ${placements.length}`)
    }

    const lines = source.split("\n")
    const bodyStart = lines.indexOf("---", 1) + 1
    let cursor = bodyStart
    let lastAnchor = ""
    let insertAt = bodyStart
    placements.forEach((placement, index) => {
      if (!placement.empty) return
      const block = code[index]
      if (!block) return
      if (placement.anchor !== lastAnchor) {
        // The export's plain text runs blocks together, so shorter suffixes
        // are tried until one falls inside a single markdown line.
        let found = -1
        for (const size of [30, 20, 12]) {
          const needle = placement.anchor.slice(-size)
          found = lines.findIndex(
            (line, lineIndex) => lineIndex >= cursor && markdownPlain(line).endsWith(needle),
          )
          if (found !== -1) break
        }
        if (found === -1) {
          throw new Error(`${row.Slug}: cannot place code block ${index + 1} after "${placement.anchor}"`)
        }
        insertAt = found + 1
        lastAnchor = placement.anchor
      }
      const fence = ["", "```" + block.language, ...block.text.replace(/\n+$/, "").split("\n"), "```", ""]
      lines.splice(insertAt, 0, ...fence)
      insertAt += fence.length
      cursor = insertAt
    })
    await writeFile(file, lines.join("\n").replace(/\n{3,}/g, "\n\n"))
    console.log(`${row.Slug}: restored ${placements.filter((placement) => placement.empty).length} code blocks`)
  }
}

await main()
