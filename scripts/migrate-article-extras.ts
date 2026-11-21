// Adds related services, related articles, and the FAQ block from the Webflow
// article export to each content/articles/*.md frontmatter. Only fields whose
// visibility flag is on and that render on the live page are migrated. Safe to
// rerun: previously migrated blocks are replaced.
//
// node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/migrate-article-extras.ts

import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  findExport,
  flagged,
  parseCsv,
  plainText,
  yamlString,
} from "./migrate-articles.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const articlesDir = path.join(root, "content", "articles")
const liveOrigin = "https://www.oliant.io"
const migratedPrefixes = ["/services/", "/articles/"]
const managedKeys = ["relatedServices", "relatedArticles", "faq"]

type Row = Record<string, string>
type Link = { title: string; href: string }

function clean(value: string) {
  return plainText(value).replace(/[\u200b-\u200d\ufeff]/g, "").trim()
}

function localHref(value: string) {
  const href = value.trim()
  if (href.startsWith(liveOrigin + "/")) {
    const pathname = href.slice(liveOrigin.length)
    return migratedPrefixes.some((prefix) => pathname.startsWith(prefix)) ? pathname : href
  }
  return href
}

function links(row: Row, kind: "Service" | "Article", count: number) {
  const result: Link[] = []
  for (let index = 1; index <= count; index += 1) {
    const title = clean(row[`Related ${kind} Title ${index}`] ?? "")
    const href = localHref(row[`Related ${kind} URL ${index}`] ?? "")
    if (title && href) {
      result.push({ title, href })
    }
  }
  return result
}

function linkYaml(key: string, items: Link[]) {
  if (items.length === 0) return []
  return [
    `${key}:`,
    ...items.flatMap((item) => [
      `  - title: ${yamlString(item.title)}`,
      `    href: ${yamlString(item.href)}`,
    ]),
  ]
}

function faqYaml(row: Row) {
  if (!flagged(row["FAQ Visibility"] ?? "")) return []
  const items: Array<{ question: string; answer: string }> = []
  for (let index = 1; index <= 8; index += 1) {
    const question = clean(row[`Question ${index}`] ?? "")
    const answer = clean(row[`Answer ${index}`] ?? "")
    if (question && answer) {
      items.push({ question, answer })
    }
  }
  const title = clean(row["FAQ Title"] ?? "")
  if (!title || items.length === 0) return []
  const text = clean(row["FAQ Paragraph"] ?? "")
  return [
    "faq:",
    `  title: ${yamlString(title)}`,
    ...(text ? [`  text: ${yamlString(text)}`] : []),
    "  items:",
    ...items.flatMap((item) => [
      `    - question: ${yamlString(item.question)}`,
      `      answer: ${yamlString(item.answer)}`,
    ]),
  ]
}

function stripManaged(frontmatter: string[]) {
  const kept: string[] = []
  let skipping = false
  for (const line of frontmatter) {
    const key = /^([A-Za-z]+):/.exec(line)?.[1]
    if (key) {
      skipping = managedKeys.includes(key)
    }
    if (!skipping) kept.push(line)
  }
  return kept
}

async function main() {
  const rows = parseCsv(await readFile(await findExport("Oliant - Articles"), "utf8"))
  let updated = 0
  for (const row of rows) {
    const file = path.join(articlesDir, `${row.Slug}.md`)
    if (!existsSync(file)) continue
    const source = await readFile(file, "utf8")
    const match = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/.exec(source)
    if (!match) throw new Error(`No frontmatter in ${file}`)
    const lines = stripManaged((match[1] ?? "").split(/\r?\n/))
    const seoIndex = lines.findIndex((line) => line.startsWith("seo:"))
    const extras = [
      ...(flagged(row["Related Services Visibility"] ?? "")
        ? linkYaml("relatedServices", links(row, "Service", 5))
        : []),
      ...(flagged(row["Related Articles Visibility"] ?? "")
        ? linkYaml("relatedArticles", links(row, "Article", 5))
        : []),
      ...faqYaml(row),
    ]
    const at = seoIndex === -1 ? lines.length : seoIndex
    lines.splice(at, 0, ...extras)
    const next = `---\n${lines.join("\n")}\n---${match[2]}`
    if (next !== source) {
      await writeFile(file, next)
      updated += 1
    }
  }
  console.log(`Updated ${updated} articles.`)
}

await main()
