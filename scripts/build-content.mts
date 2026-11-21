import { compile } from "@mdx-js/mdx"
import grayMatter from "@11ty/gray-matter"
import { spawn } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  watch,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ZodType } from "zod"

import {
  articleSchema,
  authorSchema,
  categorySchema,
  pageSchema,
  serviceSchema,
} from "../lib/content/schemas.ts"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const generatedDir = path.join(root, "lib", "content", "generated")
const production = process.argv.includes("--production")
const watchMode = process.argv.includes("--watch")

type FileError = {
  file: string
  message: string
}

type Format = "md" | "mdx"

type ParsedDocument<T> = {
  file: string
  format: Format
  body: string
  data: T
}

type AuthorData = {
  name: string
  slug: string
  role?: string
  avatar?: string
}

type SeoData = {
  title?: string
  description?: string
  image?: string
  noindex: boolean
}

type CategoryData = {
  name: string
  slug: string
  description?: string
  order?: number
  seo: SeoData
}

type ServiceData = {
  title: string
  slug: string
  summary: string
  order: number
  parent?: string
  heading?: string
  layout?: "document" | "landing"
  seo: SeoData
}

const parseMatter =
  typeof grayMatter === "function"
    ? grayMatter
    : (grayMatter as { default: (source: string) => { data: unknown; content: string } })
        .default

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear()
    const month = String(value.getUTCMonth() + 1).padStart(2, "0")
    const day = String(value.getUTCDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue)
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]),
    )
  }

  return value
}

const placeholderPhrases = [
  "lorem ipsum",
  "norem ipsum",
  "dolor sit amet",
  "this is some text inside of a div block",
  "tagline maximum two lines",
]

function walkContentFiles(directory: string, files: string[]) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      walkContentFiles(absolute, files)
      continue
    }
    if (!entry.isFile() || entry.name === ".gitkeep") {
      continue
    }
    files.push(absolute)
  }
}

function findPhrase(text: string, phrase: string) {
  const lower = text.toLowerCase()
  const matches: string[] = []
  let from = 0
  while (from < lower.length) {
    const at = lower.indexOf(phrase, from)
    if (at === -1) {
      break
    }
    matches.push(text.slice(at, at + phrase.length))
    from = at + phrase.length
  }
  return matches
}

function headingText(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function isPlaceholderHeading(value: string) {
  return headingText(value).toLowerCase() === "heading"
}

function checkPlaceholders(errors: FileError[]) {
  const contentDir = path.join(root, "content")
  if (!existsSync(contentDir)) {
    return
  }

  const files: string[] = []
  walkContentFiles(contentDir, files)

  for (const absolute of files) {
    const file = path.relative(root, absolute).split(path.sep).join("/")
    const text = readFileSync(absolute, "utf8")

    for (const phrase of placeholderPhrases) {
      for (const match of findPhrase(text, phrase)) {
        errors.push({
          file,
          message: `placeholder: "${match}"`,
        })
      }
    }

    const headings = [
      ...text.matchAll(/^ {0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm),
      ...text.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi),
      ...text.matchAll(
        /\b(?:title|heading)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{"([^"]*)"\}|\{'([^']*)'\})/g,
      ),
      ...text.matchAll(
        /^[ \t]*(?:title|heading):[ \t]*(?:"([^"]*)"|'([^']*)'|([^\n#]+?))[ \t]*$/gim,
      ),
    ]

    for (const match of headings) {
      const value = match.slice(1).find((part) => part !== undefined) ?? ""
      if (!isPlaceholderHeading(value)) {
        continue
      }
      errors.push({
        file,
        message: `placeholder: "${value.trim()}"`,
      })
    }
  }
}

function report(errors: FileError[]) {
  if (errors.length === 0) {
    return true
  }

  const grouped = new Map<string, string[]>()
  for (const error of errors) {
    const messages = grouped.get(error.file) ?? []
    messages.push(error.message)
    grouped.set(error.file, messages)
  }

  const lines = ["Content build failed.", ""]
  for (const [file, messages] of grouped) {
    lines.push(file)
    for (const message of messages) {
      lines.push(`  × ${message}`)
    }
    lines.push("")
  }

  console.error(lines.join("\n").trimEnd())
  return false
}

function reservedPageSlugs() {
  // These URLs are reserved even when the route folder does not exist yet.
  // articles, categories, and services are collection paths;
  // blog and api are top-level routes. Real top-level app folders are added below.
  const reserved = new Set(["blog", "articles", "categories", "services", "api"])
  const appDir = path.join(root, "app")
  if (!existsSync(appDir)) {
    return reserved
  }

  const addDirectory = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue
      }
      if (entry.name.startsWith("_") || entry.name.startsWith("@")) {
        continue
      }
      if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
        addDirectory(path.join(directory, entry.name))
        continue
      }
      reserved.add(entry.name)
    }
  }

  for (const entry of readdirSync(appDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }
    if (entry.name.startsWith("_") || entry.name.startsWith("@")) {
      continue
    }
    if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
      addDirectory(path.join(appDir, entry.name))
      continue
    }
    reserved.add(entry.name)
  }

  return reserved
}

function readCollection(directory: string) {
  const absolute = path.join(root, directory)
  const docs: Array<{
    file: string
    format: Format
    body: string
    data: unknown
  }> = []
  const errors: FileError[] = []

  if (!existsSync(absolute)) {
    errors.push({ file: directory, message: "Directory not found" })
    return { docs, errors }
  }

  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (!entry.isFile()) {
      errors.push({
        file: `${directory}/${entry.name}`,
        message: "Only .md and .mdx files are supported",
      })
      continue
    }

    if (entry.name === ".gitkeep") {
      continue
    }

    const extension = path.extname(entry.name)
    if (extension !== ".md" && extension !== ".mdx") {
      errors.push({
        file: `${directory}/${entry.name}`,
        message: "Only .md and .mdx files are supported",
      })
      continue
    }

    const file = `${directory}/${entry.name}`
    const stem = path.basename(entry.name, extension)
    let parsed: { data: unknown; content: string }
    try {
      const result = parseMatter(readFileSync(path.join(absolute, entry.name), "utf8"))
      parsed = {
        data: normalizeValue(result.data),
        content: result.content,
      }
    } catch (error) {
      errors.push({
        file,
        message:
          error instanceof Error ? error.message : "Could not parse front matter",
      })
      continue
    }

    if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
      errors.push({ file, message: "Front matter must be a map" })
      continue
    }

    const slug = (parsed.data as { slug?: unknown }).slug
    if (typeof slug === "string" && slug !== stem) {
      errors.push({
        file,
        message: `slug: "${slug}" does not match filename "${entry.name}"`,
      })
    }

    docs.push({
      file,
      format: extension === ".md" ? "md" : "mdx",
      body: parsed.content,
      data: parsed.data,
    })
  }

  return { docs, errors }
}

function parseDocuments<T>(
  docs: Array<{ file: string; format: Format; body: string; data: unknown }>,
  schema: ZodType<T>,
  errors: FileError[],
) {
  const parsed: Array<ParsedDocument<T>> = []
  for (const doc of docs) {
    const result = schema.safeParse(doc.data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const issuePath = issue.path.length > 0 ? issue.path.join(".") : "front matter"
        errors.push({ file: doc.file, message: `${issuePath}: ${issue.message}` })
      }
      continue
    }

    parsed.push({ ...doc, data: result.data })
  }
  return parsed
}

function duplicateSlugs<T extends { slug: string }>(
  docs: Array<ParsedDocument<T>>,
  errors: FileError[],
) {
  const seen = new Map<string, string>()
  for (const doc of docs) {
    const previous = seen.get(doc.data.slug)
    if (previous) {
      errors.push({
        file: doc.file,
        message: `slug: "${doc.data.slug}" is already used by ${previous}`,
      })
      continue
    }
    seen.set(doc.data.slug, doc.file)
  }
}

function serviceCycles(
  docs: Array<ParsedDocument<ServiceData>>,
  errors: FileError[],
) {
  const bySlug = new Map(docs.map((doc) => [doc.data.slug, doc]))
  for (const doc of docs) {
    if (!doc.data.parent) {
      continue
    }
    if (doc.data.parent === doc.data.slug) {
      errors.push({
        file: doc.file,
        message: "parent: cannot reference its own slug",
      })
      continue
    }
    if (!bySlug.has(doc.data.parent)) {
      errors.push({
        file: doc.file,
        message: `parent: "${doc.data.parent}" does not match a services document`,
      })
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()

  const visit = (slug: string, stack: string[]): string[] | null => {
    if (visiting.has(slug)) {
      const start = stack.indexOf(slug)
      return [...stack.slice(start), slug]
    }
    if (visited.has(slug)) {
      return null
    }

    visiting.add(slug)
    const parent = bySlug.get(slug)?.data.parent
    if (parent && bySlug.has(parent) && parent !== slug) {
      const cycle = visit(parent, [...stack, slug])
      if (cycle) {
        return cycle
      }
    }
    visiting.delete(slug)
    visited.add(slug)
    return null
  }

  for (const doc of docs) {
    const cycle = visit(doc.data.slug, [])
    if (!cycle) {
      continue
    }
    const file = bySlug.get(cycle[0])?.file ?? doc.file
    errors.push({
      file,
      message: `parent: cycle ${cycle.join(" -> ")}`,
    })
    break
  }
}

function categoryRecord(category: CategoryData) {
  return {
    name: category.name,
    slug: category.slug,
    ...(category.description ? { description: category.description } : {}),
    ...(category.order !== undefined ? { order: category.order } : {}),
    seo: category.seo,
    path: `/categories/${category.slug}`,
  }
}

function publicImageExists(urlPath: string) {
  const pathname = urlPath.split(/[?#]/, 1)[0] ?? ""
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return false
  }

  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return false
  }

  const segments = decoded.split("/").filter((segment) => segment.length > 0)
  if (
    segments.length === 0 ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    return false
  }

  let directory = path.join(root, "public")
  for (const segment of segments) {
    let names: string[]
    try {
      names = readdirSync(directory)
    } catch {
      return false
    }
    if (!names.includes(segment)) {
      return false
    }
    directory = path.join(directory, segment)
  }

  try {
    return statSync(directory).isFile()
  } catch {
    return false
  }
}

function checkLocalImage(
  file: string,
  field: string,
  value: string | undefined,
  errors: FileError[],
) {
  if (!value || /^https?:\/\//i.test(value)) {
    return
  }

  if (!publicImageExists(value)) {
    errors.push({
      file,
      message: `${field}: "${value}" was not found in public/`,
    })
  }
}

function authorRecord(author: AuthorData): AuthorData {
  return {
    name: author.name,
    slug: author.slug,
    ...(author.role ? { role: author.role } : {}),
    ...(author.avatar ? { avatar: author.avatar } : {}),
  }
}

type MarkdownNode = {
  type: string
  value?: string
  align?: Array<null>
  children?: MarkdownNode[]
}

type TableRow = { raw: string; cells: MarkdownNode[][] }

// Splits a paragraph into pipe-table rows and cells. Inline nodes (strong,
// emphasis, links, code) stay inside their cell; "\|" is a literal pipe.
function paragraphRows(node: MarkdownNode) {
  const rows: TableRow[] = []
  let row: TableRow = { raw: "", cells: [[]] }
  const cell = () => row.cells[row.cells.length - 1] ?? []
  const pushText = (value: string) => {
    if (!value) return
    const current = cell()
    const last = current[current.length - 1]
    if (last?.type === "text") last.value = (last.value ?? "") + value
    else current.push({ type: "text", value })
  }
  const endRow = () => {
    if (row.raw.trim()) rows.push(row)
    row = { raw: "", cells: [[]] }
  }

  for (const child of node.children ?? []) {
    if (child.type === "break") {
      endRow()
      continue
    }
    if (child.type !== "text") {
      cell().push(child)
      row.raw += "x"
      continue
    }
    const value = child.value ?? ""
    let buffer = ""
    for (let index = 0; index < value.length; index += 1) {
      const character = value[index]
      if (character === "\\" && value[index + 1] === "|") {
        buffer += "|"
        row.raw += "x"
        index += 1
      } else if (character === "|") {
        pushText(buffer)
        buffer = ""
        row.cells.push([])
        row.raw += "|"
      } else if (character === "\n") {
        pushText(buffer)
        buffer = ""
        endRow()
      } else {
        buffer += character
        row.raw += character
      }
    }
    pushText(buffer)
  }
  endRow()

  for (const item of rows) {
    item.raw = item.raw.trim()
    const isBlank = (nodes: MarkdownNode[]) =>
      nodes.every((part) => part.type === "text" && !(part.value ?? "").trim())
    if (item.cells.length > 1 && isBlank(item.cells[0] ?? [])) item.cells.shift()
    if (item.cells.length > 1 && isBlank(item.cells[item.cells.length - 1] ?? [])) item.cells.pop()
    for (const parts of item.cells) {
      const first = parts[0]
      const last = parts[parts.length - 1]
      if (first?.type === "text") first.value = (first.value ?? "").trimStart()
      if (last?.type === "text") last.value = (last.value ?? "").trimEnd()
    }
    item.cells = item.cells.map((parts) =>
      parts.filter((part) => part.type !== "text" || part.value),
    )
  }
  return rows
}

function remarkTables() {
  return (tree: MarkdownNode) => {
    const walk = (node: MarkdownNode) => {
      if (!node.children) return
      for (let index = 0; index < node.children.length; index += 1) {
        const child = node.children[index]
        if (!child) continue
        if (child.type === "paragraph") {
          const rows = paragraphRows(child)
          const separator = /^\|(?:\s*:?-{3,}:?\s*\|)+$/
          if (
            rows.length >= 3 &&
            rows.every((row) => row.raw.startsWith("|") && row.raw.endsWith("|")) &&
            separator.test(rows[1]?.raw ?? "")
          ) {
            const toRow = (row: TableRow): MarkdownNode => ({
              type: "tableRow",
              children: row.cells.map((parts) => ({ type: "tableCell", children: parts })),
            })
            node.children[index] = {
              type: "table",
              align: (rows[1]?.cells ?? []).map(() => null),
              children: [toRow(rows[0] as TableRow), ...rows.slice(2).map(toRow)],
            }
            continue
          }
        }
        walk(child)
      }
    }
    walk(tree)
  }
}

async function compileBody(body: string, format: Format) {
  const compiled = await compile(body, {
    format,
    outputFormat: "program",
    development: false,
    remarkPlugins: format === "md" ? [remarkTables] : [],
  })
  const code = String(compiled)
  return code.endsWith("\n") ? code : `${code}\n`
}

function writeJsonModule(fileName: string, exports: Array<[string, unknown, string]>) {
  const imports = `import type { ArticleMeta, AuthorMeta, CategoryMeta, PageMeta, ServiceMeta } from "../records"\n\n`
  const body = exports
    .map(
      ([name, value, typeName]) =>
        `export const ${name}: ${typeName}[] = ${JSON.stringify(value, null, 2)}\n`,
    )
    .join("\n")
  writeFileSync(path.join(generatedDir, fileName), `${imports}${body}`)
}

function writeLoaders(
  groups: Array<{ name: string; collection: string; slugs: string[] }>,
) {
  const lines = [
    `import type { MdxContent } from "@/components/mdx"`,
    "",
  ]
  for (const group of groups) {
    lines.push(
      `export const ${group.name}: Record<string, () => Promise<{ default: MdxContent }>> = {`,
    )
    for (const slug of group.slugs) {
      const specifier = `./bodies/${group.collection}/${slug}.js`
      lines.push(
        `  ${JSON.stringify(slug)}: () => import(${JSON.stringify(specifier)}) as Promise<{ default: MdxContent }>,`,
      )
    }
    lines.push("}", "")
  }
  writeFileSync(path.join(generatedDir, "loaders.ts"), lines.join("\n"))
}

function writeBodyFile(collection: string, slug: string, code: string) {
  const directory = path.join(generatedDir, "bodies", collection)
  mkdirSync(directory, { recursive: true })
  writeFileSync(path.join(directory, `${slug}.js`), code)
  writeFileSync(
    path.join(directory, `${slug}.d.ts`),
    `import type { MdxContent } from "@/components/mdx"\n\ndeclare const Content: MdxContent\nexport default Content\n`,
  )
}

async function buildContent() {
  const errors: FileError[] = []
  checkPlaceholders(errors)
  const articlesRead = readCollection("content/articles")
  const authorsRead = readCollection("content/authors")
  const categoriesRead = readCollection("content/categories")
  const servicesRead = readCollection("content/services")
  const pagesRead = readCollection("content/pages")
  errors.push(
    ...articlesRead.errors,
    ...authorsRead.errors,
    ...categoriesRead.errors,
    ...servicesRead.errors,
    ...pagesRead.errors,
  )

  const articles = parseDocuments(articlesRead.docs, articleSchema, errors)
  const authors = parseDocuments(authorsRead.docs, authorSchema, errors)
  const categories = parseDocuments(categoriesRead.docs, categorySchema, errors)
  const services = parseDocuments(servicesRead.docs, serviceSchema, errors)
  const pages = parseDocuments(pagesRead.docs, pageSchema, errors)

  duplicateSlugs(articles, errors)
  duplicateSlugs(authors, errors)
  duplicateSlugs(categories, errors)
  duplicateSlugs(services, errors)
  duplicateSlugs(pages, errors)
  serviceCycles(services, errors)

  const authorsBySlug = new Map(authors.map((doc) => [doc.data.slug, doc]))
  const categoriesBySlug = new Map(categories.map((doc) => [doc.data.slug, doc]))
  for (const article of articles) {
    if (!authorsBySlug.has(article.data.author)) {
      errors.push({
        file: article.file,
        message: `author: "${article.data.author}" does not match an authors document`,
      })
    }
    if (!categoriesBySlug.has(article.data.category)) {
      errors.push({
        file: article.file,
        message: `category: "${article.data.category}" does not match a categories document`,
      })
    }
  }

  for (const category of categories) {
    if (category.body.trim() !== "") {
      errors.push({
        file: category.file,
        message: "body: categories do not include a body",
      })
    }
  }

  const articleSlugs = new Set(articles.map((article) => article.data.slug))
  for (const article of articles) {
    checkLocalImage(article.file, "coverImage.src", article.data.coverImage.src, errors)
    checkLocalImage(article.file, "seo.image", article.data.seo.image, errors)
    article.data.relatedArticles.forEach((link, index) => {
      const slug = /^\/articles\/([^/]+)$/.exec(link.href)?.[1]
      if (link.href.startsWith("/") && (!slug || !articleSlugs.has(slug))) {
        errors.push({
          file: article.file,
          message: `relatedArticles.${index}.href: "${link.href}" does not match an article`,
        })
      }
    })
  }
  for (const author of authors) {
    checkLocalImage(author.file, "avatar", author.data.avatar, errors)
  }
  for (const category of categories) {
    checkLocalImage(category.file, "seo.image", category.data.seo.image, errors)
  }
  for (const service of services) {
    checkLocalImage(service.file, "seo.image", service.data.seo.image, errors)
    if (service.data.layout !== "landing") {
      continue
    }
    const prefix = `/images/services/${service.data.slug}/`
    const paths = [
      ...service.body.matchAll(/["'](\/images\/[^"']+)["']/g),
    ].map((match) => match[1] ?? "")
    if (paths.length === 0) {
      errors.push({
        file: service.file,
        message: "layout: landing pages include their images in the body",
      })
    }
    for (const imagePath of paths) {
      if (!imagePath.startsWith(prefix)) {
        errors.push({
          file: service.file,
          message: `image: "${imagePath}" must start with ${prefix}`,
        })
      }
      checkLocalImage(service.file, "image", imagePath, errors)
    }
  }
  for (const page of pages) {
    checkLocalImage(page.file, "seo.image", page.data.seo.image, errors)
    const prefix = `/images/pages/${page.data.slug}/`
    for (const match of page.body.matchAll(/["'](\/images\/[^"']+)["']/g)) {
      const imagePath = match[1] ?? ""
      if (!imagePath.startsWith(prefix)) {
        errors.push({
          file: page.file,
          message: `image: "${imagePath}" must start with ${prefix}`,
        })
      }
      checkLocalImage(page.file, "image", imagePath, errors)
    }
  }

  const reserved = reservedPageSlugs()
  for (const page of pages) {
    if (reserved.has(page.data.slug)) {
      errors.push({
        file: page.file,
        message: `slug: "${page.data.slug}" is reserved for a top-level route`,
      })
    }
  }

  if (!report(errors)) {
    return false
  }

  const visibleArticles = production
    ? articles.filter((article) => !article.data.draft)
    : articles

  const compiled = new Map<string, string>()
  const compileErrors: FileError[] = []
  const sources = [
    ...visibleArticles.map((doc) => ({ collection: "articles", doc })),
    ...authors.map((doc) => ({ collection: "authors", doc })),
    ...services.map((doc) => ({ collection: "services", doc })),
    ...pages.map((doc) => ({ collection: "pages", doc })),
  ]

  for (const source of sources) {
    try {
      compiled.set(
        `${source.collection}/${source.doc.data.slug}`,
        await compileBody(source.doc.body, source.doc.format),
      )
    } catch (error) {
      compileErrors.push({
        file: source.doc.file,
        message: error instanceof Error ? error.message : "Could not compile content",
      })
    }
  }

  if (!report(compileErrors)) {
    return false
  }

  rmSync(generatedDir, { recursive: true, force: true })
  mkdirSync(generatedDir, { recursive: true })

  for (const source of sources) {
    const code = compiled.get(`${source.collection}/${source.doc.data.slug}`)
    if (!code) {
      throw new Error(`Missing compiled body for ${source.doc.file}`)
    }
    writeBodyFile(source.collection, source.doc.data.slug, code)
  }

  const articleMeta = visibleArticles
    .map((article) => {
      const author = authorsBySlug.get(article.data.author)
      const category = categoriesBySlug.get(article.data.category)
      if (!author) {
        throw new Error(`Missing author for ${article.file}`)
      }
      if (!category) {
        throw new Error(`Missing category for ${article.file}`)
      }
      return {
        title: article.data.title,
        heading: article.data.heading ?? article.data.title,
        slug: article.data.slug,
        date: article.data.date,
        ...(article.data.updated ? { updated: article.data.updated } : {}),
        author: authorRecord(author.data),
        category: categoryRecord(category.data),
        excerpt: article.data.excerpt,
        coverImage: article.data.coverImage,
        draft: article.data.draft,
        relatedServices: article.data.relatedServices,
        relatedArticles: article.data.relatedArticles,
        ...(article.data.faq ? { faq: article.data.faq } : {}),
        seo: article.data.seo,
        path: `/articles/${article.data.slug}`,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))

  const authorMeta = authors
    .map((author) => authorRecord(author.data))
    .sort((a, b) => a.slug.localeCompare(b.slug))

  const categoryMeta = categories
    .map((category) => categoryRecord(category.data))
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
        a.slug.localeCompare(b.slug),
    )

  const servicesWithChildren = new Set(
    services.flatMap((service) =>
      service.data.parent ? [service.data.parent] : [],
    ),
  )

  const serviceMeta = services
    .map((service) => {
      const groupsChildren = servicesWithChildren.has(service.data.slug)
      const path = groupsChildren
        ? null
        : service.data.parent
          ? `/services/${service.data.parent}/${service.data.slug}`
          : `/services/${service.data.slug}`

      return {
        title: service.data.title,
        slug: service.data.slug,
        summary: service.data.summary,
        order: service.data.order,
        ...(service.data.parent ? { parent: service.data.parent } : {}),
        heading: service.data.heading ?? service.data.title,
        ...(service.data.layout ? { layout: service.data.layout } : {}),
        seo: service.data.seo,
        path,
      }
    })
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))

  const pageMeta = pages
    .map((page) => ({
      title: page.data.title,
      slug: page.data.slug,
      heading: page.data.heading ?? page.data.title,
      ...(page.data.layout ? { layout: page.data.layout } : {}),
      seo: page.data.seo,
      path: `/${page.data.slug}`,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug))

  writeJsonModule("meta.ts", [
    ["articleMeta", articleMeta, "ArticleMeta"],
    ["authorMeta", authorMeta, "AuthorMeta"],
    ["categoryMeta", categoryMeta, "CategoryMeta"],
    ["serviceMeta", serviceMeta, "ServiceMeta"],
    ["pageMeta", pageMeta, "PageMeta"],
  ])

  const slugs = (items: Array<{ slug: string }>) => items.map((item) => item.slug)
  writeLoaders([
    { name: "articleBodies", collection: "articles", slugs: slugs(articleMeta) },
    { name: "authorBodies", collection: "authors", slugs: slugs(authorMeta) },
    { name: "serviceBodies", collection: "services", slugs: slugs(serviceMeta) },
    { name: "pageBodies", collection: "pages", slugs: slugs(pageMeta) },
  ])

  const documentCount = sources.length + categories.length
  console.log(
    `Content build wrote ${documentCount} document${documentCount === 1 ? "" : "s"}.`,
  )
  return true
}

function startNext() {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next")
  const child = spawn(process.execPath, [nextBin, "dev"], {
    cwd: root,
    stdio: "inherit",
  })

  const stop = () => {
    child.kill()
  }
  process.on("SIGINT", stop)
  process.on("SIGTERM", stop)
  child.on("exit", (code) => {
    process.exit(code ?? 0)
  })
}

let rebuilding = false
let rebuildQueued = false

async function rebuild() {
  if (rebuilding) {
    rebuildQueued = true
    return
  }

  rebuilding = true
  do {
    rebuildQueued = false
    const ok = await buildContent()
    if (!ok) {
      console.error("Content build failed. The previous output was left in place.")
    }
  } while (rebuildQueued)
  rebuilding = false
}

const ok = await buildContent()
if (!ok) {
  process.exit(1)
}

if (watchMode) {
  startNext()
  watch(path.join(root, "content"), { recursive: true }, () => {
    void rebuild()
  })
}
