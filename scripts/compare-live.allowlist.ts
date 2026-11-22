// Intentional differences between the live site and the migration.
// Each entry needs a reason; it shows next to the difference in the report.
//
// Text entries match one word-diff hunk: `removed` is the live-only text and
// `added` the local-only text (omit a side to require it to be empty). `hunk`
// sees both sides at once.
// Item entries match one heading, link, image, or robots value that exists on one side only.

import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export type Matcher = string | RegExp | ((value: string) => boolean)

type PageMatcher = string | RegExp

type ItemKind =
  | "heading"
  | "link:main"
  | "link:header"
  | "link:footer"
  | "link:pager"
  | "image"
  | "image-count"
  | "status"
  | "robots"

export type AllowEntry = {
  kind: "text" | ItemKind
  pages: PageMatcher | PageMatcher[]
  reason: string
  removed?: Matcher
  added?: Matcher
  hunk?: (removed: string, added: string) => boolean
  // Text entries only: tested against "<words before> ¦ <words after>".
  context?: RegExp
  side?: "live" | "local"
  match?: Matcher
}

const any = /[\s\S]*/
const articles = /^\/articles\//
const categories = /^\/categories\//
const services = /^\/services\//

function escape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function oneOf(values: string[], suffix = "") {
  return new RegExp(`^(?:${values.map(escape).join("|")})${suffix}$`)
}

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
}

const sameIgnoringSpaces = (removed: string, added: string) =>
  removed !== added && removed.replace(/\s/g, "") === added.replace(/\s/g, "")

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function contentFiles(type: string) {
  const dir = path.join(root, "content", type)
  return readdirSync(dir)
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => ({ slug: file.replace(/\.mdx?$/, ""), source: readFileSync(path.join(dir, file), "utf8") }))
}

function frontmatterValue(source: string, key: string) {
  const raw = new RegExp(`^${key}: (.+)$`, "m").exec(source)?.[1]?.trim()
  if (!raw) return undefined
  return raw.startsWith('"') ? (JSON.parse(raw) as string) : raw
}

function questionsIn(source: string) {
  return [...source.matchAll(/^\s+-? ?question: (.+?),?$/gm)].map((match) => {
    const raw = match[1]?.trim() ?? ""
    return normalize(raw.startsWith('"') ? (JSON.parse(raw) as string) : raw)
  })
}

// FAQ questions are H6 on live and H3 (inside the accordion button) locally.
function faqHeadings(): AllowEntry[] {
  const reason = "FAQ question is an H6 on live; locally it is an H3 inside the accordion button"
  const development = new Set([
    "react",
    "angular",
    "net",
    "java",
    "node",
    "python",
    "webflow",
    "wordpress",
    "google-cloud-platform",
    "aws",
    "microsoft-azure",
  ])
  const pages = [
    ...contentFiles("articles").map((file) => ({ page: `/articles/${file.slug}`, source: file.source })),
    ...contentFiles("services").map((file) => ({
      page: development.has(file.slug) ? `/services/development/${file.slug}` : `/services/${file.slug}`,
      source: file.source,
    })),
  ]
  return pages.flatMap(({ page, source }) => {
    const questions = questionsIn(source)
    if (questions.length === 0) return []
    return [
      {
        kind: "heading",
        pages: page,
        side: "local",
        match: oneOf(questions.map((question) => `H3 ${question}`)),
        reason,
      } satisfies AllowEntry,
    ]
  })
}

// Category pages list every article of the category on one page, newest
// first; live paginates (6 per page) in Webflow CMS order. A text hunk passes
// when it consists only of card text (titles, author names, dates, category
// names, page numbers).
function categoryEntries(): AllowEntry[] {
  const categoryNames = contentFiles("categories").map((file) => frontmatterValue(file.source, "name") ?? "")
  const cardText = [
    ...contentFiles("articles").flatMap((file) => [
      frontmatterValue(file.source, "title") ?? "",
      frontmatterValue(file.source, "heading") ?? "",
    ]),
    ...contentFiles("authors").map((file) => frontmatterValue(file.source, "name") ?? ""),
    ...categoryNames,
    "January February March April May June July August September October November December",
  ]
  const vocabulary = new Set(normalize(cardText.join(" ")).split(" "))
  const cardWords = (value: string) =>
    value.split(" ").every((word) => word === "" || vocabulary.has(word) || /^(?:\d{1,2},|\d{4}|\d)$/.test(word))
  const reason = "Category lists all its articles on one page, newest first; live paginates 6 per page in CMS order"
  return [
    { kind: "text", pages: categories, removed: cardWords, added: cardWords, reason },
    { kind: "link:main", pages: categories, side: "live", match: /^(?:\d+|\(no text\)) -> (?:\?\w+_page=\d+|#)$/, reason },
    { kind: "link:main", pages: categories, side: "local", match: /^.+ -> \/articles\/[\w-]+$/, reason },
    { kind: "heading", pages: categories, side: "local", match: /^H3 /, reason },
    { kind: "image", pages: categories, side: "local", match: 'alt=""', reason },
    { kind: "image-count", pages: categories, side: "local", match: any, reason },
    {
      kind: "heading",
      pages: categories,
      side: "local",
      match: oneOf(categoryNames.map((name) => `H1 ${name}`)),
      reason: "Category name is an H4 on live (the page has no H1); locally it is the page H1",
    },
  ]
}

const placeholderNav = [
  "Enterprise Solutions",
  "Custom Development",
  "SEO Optimization",
  "Content Marketing",
  "Social Media Marketing",
  "Google Cloud Partner",
  "Odoo",
  "Languages",
  "Java",
  "Node",
  "Python",
  "Frameworks",
  "No Code",
  "WebFlow",
  "WordPress",
  "Cloud",
  "Google Cloud Platform",
  "AWS",
  "Microsoft Azure",
  "About Us",
  "Contact Us",
]

const articleHeadings = contentFiles("articles").flatMap((file) =>
  [frontmatterValue(file.source, "heading"), frontmatterValue(file.source, "title")].filter(
    (value): value is string => Boolean(value),
  ),
)

const mvpIntroLive = normalize(
  "Startup-to-enterprise experience: With 30+ years delivering gloEnd-to-end coverage: From strategy through QA and deployment, you get a seamless, integrated team—not a piecemeal vendor.bal teams and distributed systems, we bring both startup agility and enterprise-class rigor.",
)
const mvpIntroLocal = normalize(
  "Startup-to-enterprise experience: With 30+ years delivering global end-to-end coverage —from strategy through QA and deployment —you get a seamless, integrated team, not a piecemeal vendor.",
)

const angularLiveCopy = [
  "Deliver high-quality and modern UI",
  "Our team delivered several solutions using the most modern UX/UI techniques for different markets and industries.",
  "We merge extensive knowledge of architecture, user experience, and industry expertise into teams that understand your market, suggest solutions, and build applications end to end.",
  "Angular Continuous Delivery",
  "If you already have a cloud provider or Enterprise solution or need help deploying to different host providers, our teams master Continuous Delivery, ensuring your code goes live without issues, is thoroughly tested, and runs smoothly.",
].map(normalize)

const angularLocalCopy = [
  "Angular interfaces that stay current",
  "Our teams deliver Angular for enterprise products: a typed architecture, progressive web apps, and version upgrades.",
  "We apply Angular's typed architecture to enterprise applications: strict TypeScript, clear module boundaries, and a structure the next team can extend without a rewrite.",
  "Progressive web apps and upgrades",
  "When the product should install and keep working offline, we build it as an Angular progressive web app. When an enterprise app is on an older Angular, we upgrade it in steps so releases keep shipping while the framework moves forward.",
].map(normalize)

const angularLiveText = angularLiveCopy.join(" ")
const angularLocalText = angularLocalCopy.join(" ")

const angularSeoHunk = (removed: string, added: string) =>
  (removed === "" || angularLiveText.includes(removed)) &&
  (added === "" || angularLocalText.includes(added)) &&
  removed + added !== ""

const serviceBreadcrumb =
  "Breadcrumb: live renders it under the fixed header (not visible) with typos and Webflow placeholders; locally it is visible below the header as Home / Services / [Parent] / [service title], with Services and the parent as plain text"

export const allowlist: AllowEntry[] = [
  // ---------- site header and footer (every page) ----------
  {
    kind: "link:header",
    pages: any,
    side: "live",
    match: oneOf(placeholderNav, " -> #"),
    reason:
      "Webflow placeholder href=\"#\". Items with a real destination now link to it; the rest render as plain labels",
  },
  {
    kind: "link:header",
    pages: any,
    side: "live",
    match: oneOf(
      ["Manual Testing", "Automation", "Performance Testing"].map((label) => `${label} -> /services/qa`),
    ),
    reason: "QA sub-items now deep-link to their section on /services/qa",
  },
  {
    kind: "link:header",
    pages: any,
    side: "live",
    match: "Partners -> /services/digital-marketing-seo",
    reason: "\"Partners\" is a group heading in the menu; its only real child links are kept",
  },
  {
    kind: "link:header",
    pages: any,
    side: "local",
    match: oneOf([
      "Custom Development -> /services/custom-development",
      "Java -> /services/development/java",
      "Node -> /services/development/node",
      "Python -> /services/development/python",
      "Manual Testing -> /services/qa#manual-testing",
      "Automation -> /services/qa#automation",
      "Performance Testing -> /services/qa#performance-testing",
      "SEO Optimization -> /services/digital-marketing-seo#seo-optimization",
      "Content Marketing -> /services/digital-marketing-seo#content-marketing",
      "Social Media Marketing -> /services/digital-marketing-seo#social-media-marketing",
      "WebFlow -> /services/development/webflow",
      "WordPress -> /services/development/wordpress",
      "Google Cloud Platform -> /services/development/google-cloud-platform",
      "AWS -> /services/development/aws",
      "Microsoft Azure -> /services/development/microsoft-azure",
      "About Us -> /about-us",
      "Contact Us -> /contact-us",
    ]),
    reason: "Replacement for a Webflow placeholder \"#\" (or generic) menu link",
  },
  {
    kind: "link:footer",
    pages: any,
    side: "live",
    match: "+1-224-238-3800 -> #",
    reason: "Phone number placeholder href=\"#\" replaced with a tel: link",
  },
  {
    kind: "link:footer",
    pages: any,
    side: "local",
    match: "+1-224-238-3800 -> tel:+12242383800",
    reason: "Phone number placeholder href=\"#\" replaced with a tel: link",
  },
  {
    kind: "link:footer",
    pages: any,
    side: "live",
    match: "Subscribe -> #",
    reason: "Newsletter submit is a real <button> locally (submission left unwired, TODO)",
  },

  // ---------- images ----------
  {
    kind: "image",
    pages: any,
    side: "live",
    match: 'alt=""',
    reason: "Live leaves this alt empty; locally it carries the CMS alt text (image count is checked separately)",
  },
  {
    kind: "image",
    pages: any,
    side: "local",
    match: /^alt=".+"$/,
    reason: "Alt text added from the CMS \"Images Alt text\" field; live renders alt=\"\"",
  },
  {
    kind: "image",
    pages: [services, "/"],
    side: "local",
    match: 'alt=""',
    reason: "Decorative icon (check marks, service and reason icons): <img alt=\"\"> locally, inline SVG on live",
  },
  {
    kind: "image-count",
    pages: [services, "/"],
    side: "local",
    match: any,
    reason:
      "Extra local images are the decorative icons (check marks, service and reason icons) that live draws as inline SVG; see the file list",
  },

  ...faqHeadings(),

  // ---------- home ----------
  {
    kind: "link:main",
    pages: "/",
    side: "live",
    match: /^(?:Software Development|Technology|Talent|Biz & Tech|Innovation) -> \/articles\/[\w-]+$/,
    reason: "Insights card: live links the category tag to the article; locally the tag links to its category and the title to the article",
  },
  {
    kind: "link:main",
    pages: "/",
    side: "local",
    match: /^(?:(?:Software Development|Technology|Talent|Biz & Tech|Innovation) -> \/categories\/[\w-]+|.+ -> \/articles\/[\w-]+)$/,
    reason: "Insights card: live links the category tag to the article; locally the tag links to its category and the title to the article",
  },

  // ---------- services ----------
  {
    kind: "robots",
    pages: [
      "/services/web",
      "/services/staff-augmentation",
      "/services/mvp-development",
      "/services/digital-marketing-seo",
      "/services/development/react",
      "/services/development/angular",
      "/services/development/net",
    ],
    side: "live",
    match: "noindex",
    reason:
      "Webflow marks this service page noindex; it is indexable locally now that the copy is approved",
  },
  {
    kind: "text",
    pages: "/services/web",
    removed: "Develoment",
    added: "Development",
    context: /Services Web ¦/,
    reason: `${serviceBreadcrumb} (live has the typo "Develoment")`,
  },
  {
    kind: "text",
    pages: "/services/development/react",
    removed: "Website",
    context: /Services ¦ Development React/,
    reason: `${serviceBreadcrumb} (live labels the parent "Website Development")`,
  },
  {
    kind: "text",
    pages: ["/services/development/react", "/services/development/angular"],
    removed: "Development",
    context: /Development (?:React|Angular) ¦ (?:REACT|ANGULAR) DEVELOPMENT/,
    reason: `${serviceBreadcrumb} (live ends the trail in "<Name> Development"; locally it is the service title)`,
  },
  {
    kind: "text",
    pages: "/services/development/net",
    removed: "Development",
    added: "/ C#",
    context: /Services Development \.Net ¦/,
    reason: `${serviceBreadcrumb} (live ends the trail in ".Net Development"; locally it is the service title ".Net / C#")`,
  },
  {
    kind: "text",
    pages: "/services/qa",
    removed: "Testig and",
    added: "Testing &",
    context: /Services QA ¦ Automation/,
    reason: `${serviceBreadcrumb} (live has "Testig and Automation QA"; locally it is the service title)`,
  },
  {
    kind: "text",
    pages: "/services/mvp-development",
    removed: "Third Level Service Title",
    context: /Services MVP Development ¦/,
    reason: `${serviceBreadcrumb} (live ends in the Webflow placeholder "Third Level Service Title")`,
  },
  {
    kind: "text",
    pages: "/services/digital-marketing-seo",
    removed: "TAGLINE MAXIMUM TWO LINES",
    context: /Services Digital Marketing & SEO ¦/,
    reason: `${serviceBreadcrumb} ("TAGLINE MAXIMUM TWO LINES" after it is a Webflow placeholder)`,
  },
  {
    kind: "link:main",
    pages: services,
    side: "live",
    match: oneOf([
      "Services -> #",
      "Development -> /services/web",
      "Website Development -> /services/web",
      "MVP Development -> #",
      "Third Level -> #",
    ]),
    reason: serviceBreadcrumb,
  },
  {
    kind: "text",
    pages: "/services/digital-marketing-seo",
    removed: /^Heading Lorem ipsum dolor sit amet/,
    reason: "Webflow placeholder block (\"Heading\" + lorem ipsum); not migrated",
  },
  {
    kind: "heading",
    pages: "/services/digital-marketing-seo",
    side: "live",
    match: "H2 Heading",
    reason: "Webflow placeholder block (\"Heading\" + lorem ipsum); not migrated",
  },
  {
    kind: "text",
    pages: ["/services/mvp-development", "/"],
    removed: /^Reason [1-4]$/,
    reason: "Webflow placeholder title (\"Reason 1-4\"); the reason text itself is migrated",
  },
  {
    kind: "heading",
    pages: ["/services/mvp-development", "/"],
    side: "live",
    match: /^H3 Reason [1-4]$/,
    reason: "Webflow placeholder title (\"Reason 1-4\"); the reason text itself is migrated",
  },
  {
    kind: "text",
    pages: "/services/mvp-development",
    removed: any,
    added: any,
    hunk: (removed, added) =>
      mvpIntroLive.includes(removed.replace(/ Reason [1-4]$/, "")) && mvpIntroLocal.includes(added),
    reason:
      "Content correction: the garbled \"Why Choose Oliant\" intro (two reasons spliced mid-word) is replaced with the client-supplied text",
  },
  {
    kind: "link:main",
    pages: "/services/mvp-development",
    side: "local",
    match: "See Our Process → -> #process",
    reason:
      "Live renders this CTA as a <button> that does nothing (its href=\"#\" link is display:none); locally it jumps to the services/process section",
  },
  {
    kind: "text",
    pages: "/services/development/react",
    removed: "moder",
    added: "modern",
    reason: "Typo fix",
  },
  {
    kind: "heading",
    pages: "/services/development/angular",
    side: "live",
    match: "H1 Deliver high-quality and modern UI",
    reason:
      "Content correction: the Angular H1 no longer repeats the React H1; it is \"Angular interfaces that stay current\"",
  },
  {
    kind: "heading",
    pages: "/services/development/angular",
    side: "local",
    match: "H1 Angular interfaces that stay current",
    reason:
      "Content correction: the Angular H1 no longer repeats the React H1; it is \"Angular interfaces that stay current\"",
  },
  {
    kind: "text",
    pages: "/services/development/angular",
    removed: any,
    added: any,
    hunk: angularSeoHunk,
    reason:
      "Content correction: the Angular H1, hero, and two reason columns are specific to Angular (typed architecture, enterprise apps, PWAs, upgrades) instead of repeating the React page",
  },
  {
    kind: "text",
    pages: "/services/digital-marketing-seo",
    removed: "standards",
    added: "standards.",
    reason: "Missing final period restored on the QA reason card",
  },
  {
    kind: "text",
    pages: "/services/qa",
    removed: "ApachBench,",
    added: "ApacheBench,",
    reason: "Typo fix (tool name)",
  },
  {
    kind: "text",
    pages: "/services/development/net",
    removed: "architecting.Net",
    added: "architecting .Net",
    reason: "Typo fix (missing space)",
  },
  {
    kind: "text",
    pages: "/services/development/net",
    removed: "of",
    added: "or",
    context: /Python\.Net, ¦ Visual Basic/,
    reason: "Typo fix (\"of\" → \"or\" in a list of languages)",
  },
  {
    kind: "text",
    pages: "/services/development/net",
    added: "it",
    context: /Is ¦ easy to find \.Net developers/,
    reason: "Typo fix (missing word in the FAQ question)",
  },
  {
    kind: "text",
    pages: "/services/staff-augmentation",
    removed: "\\What",
    added: "What",
    reason: "Stray backslash from the live rich text removed",
  },

  // ---------- articles ----------
  {
    kind: "link:pager",
    pages: articles,
    side: "live",
    match: any,
    reason:
      "Previous/next article: live follows Webflow's CMS order (sometimes two cards under one label); locally articles are ordered by publish date",
  },
  {
    kind: "link:pager",
    pages: articles,
    side: "local",
    match: any,
    reason:
      "Previous/next article: live follows Webflow's CMS order (sometimes two cards under one label); locally articles are ordered by publish date",
  },
  {
    kind: "text",
    pages: articles,
    removed: "world",
    added: "world.",
    context: /tech reshapes our ¦/,
    reason:
      "Author bio comes from the author record (one canonical bio); live copies a per-article bio that sometimes lacks the final period",
  },
  {
    kind: "text",
    pages: "/articles/git-bash-commonly-used-commands",
    added: "(https://git-scm.com/downloads/guis)",
    reason: "Live link has a malformed href; the article migration kept the intended URL as text",
  },
  {
    kind: "link:main",
    pages: "/articles/git-bash-commonly-used-commands",
    side: "live",
    match: /^GUI clients section -> http:\/\/Git Bash/,
    reason: "Live link has a malformed href (the whole article text); not migrated as a link",
  },
  {
    kind: "text",
    pages: "/articles/git-bash-commonly-used-commands",
    removed: "-- global",
    added: "--global",
    reason: "Live code block splits --global across elements with a stray space; same rendered command",
  },
  {
    kind: "text",
    pages: "/articles/git-bash-commonly-used-commands",
    removed: '"<youraddress@domain.com" >',
    added: '"<youraddress@domain.com">',
    reason: "Live code block has a stray space before the closing >; same rendered command",
  },
  {
    kind: "text",
    pages: "/articles/react-architecture-and-state-management",
    removed: any,
    added: any,
    hunk: sameIgnoringSpaces,
    reason: "Code block: the line break after a file-name comment is a separate element on live; same code",
  },
  {
    kind: "text",
    pages: "/articles/mentorship-programs-2025-guide",
    removed: "HR Solutions - Factorial",
    reason: "Content correction: /oliant-factorial is no longer linked; the Related Services entry is removed",
  },
  {
    kind: "link:main",
    pages: "/articles/mentorship-programs-2025-guide",
    side: "live",
    match: "HR Solutions - Factorial -> /oliant-factorial",
    reason: "Content correction: /oliant-factorial is no longer linked; the Related Services entry is removed",
  },
  {
    kind: "link:main",
    pages: "/articles/remote-team-management-2025",
    side: "live",
    match: "(no text) -> https://www.teamland.com/post/team-building-statistics",
    reason: "Empty anchor on live (no text, nothing clickable to see); the cited sentence is migrated without it",
  },

  // ---------- blog and categories ----------
  {
    kind: "text",
    pages: "/blog",
    added: "OLIANT's Insights",
    reason: "Content correction: live /blog has no page title; \"OLIANT's Insights\" is added as the page H1",
  },
  {
    kind: "heading",
    pages: "/blog",
    side: "local",
    match: "H1 OLIANT's Insights",
    reason: "Content correction: live /blog has no page title; \"OLIANT's Insights\" is added as the page H1",
  },
  {
    kind: "heading",
    pages: "/blog",
    side: "live",
    match: oneOf(articleHeadings.map((heading) => `H1 ${normalize(heading)}`)),
    reason: "Featured article title is the page H1 on live; locally it is an H2 (same style) under the \"OLIANT's Insights\" H1",
  },
  {
    kind: "heading",
    pages: "/blog",
    side: "local",
    match: oneOf(articleHeadings.map((heading) => `H2 ${normalize(heading)}`)),
    reason: "Featured article title is the page H1 on live; locally it is an H2 (same style) under the \"OLIANT's Insights\" H1",
  },
  {
    kind: "text",
    pages: "/blog",
    removed: "See All Articles",
    reason: "\"See All Articles\" pointed at /all-articles, which 301s back to /blog (self-link removed)",
  },
  {
    kind: "link:main",
    pages: "/blog",
    side: "live",
    match: "See All Articles -> /all-articles",
    reason: "\"See All Articles\" pointed at /all-articles, which 301s back to /blog (self-link removed)",
  },
  {
    kind: "heading",
    pages: "/blog",
    side: "local",
    match: /^H2 (?:SOFTWARE DEVELOPMENT|TECHNOLOGY|TALENT|BIZ & TECH|INNOVATION)$/,
    reason: "Category strip label is an H4 on live (skips H2/H3); locally it is an H2",
  },
  {
    kind: "text",
    pages: "/blog",
    removed: "development",
    added: "Development",
    context: /All Software ¦ Articles/,
    reason: "Capitalization fix (\"All Software development Articles\" → category name)",
  },
  {
    kind: "link:main",
    pages: "/blog",
    side: "live",
    match: "All Software development Articles -> /categories/software-development",
    reason: "Capitalization fix (\"All Software development Articles\" → category name)",
  },
  {
    kind: "link:main",
    pages: "/blog",
    side: "local",
    match: "All Software Development Articles -> /categories/software-development",
    reason: "Capitalization fix (\"All Software development Articles\" → category name)",
  },
  {
    kind: "link:main",
    pages: "/blog",
    side: "local",
    match: /^.+ -> \/articles\/[\w-]+$/,
    reason: "Latest-post card titles link to the article locally; on live only the category tag is a link",
  },
  ...categoryEntries(),

  // ---------- pages ----------
  {
    kind: "text",
    pages: "/contact-us",
    removed: "Sofia(+30) 2810-300345",
    added: "Sofia",
    reason: "Content correction: the Sofia office phone number (a Greek +30 number) is removed; the rest of the office details stay",
  },
  {
    kind: "text",
    pages: "/privacy-policy",
    removed: any,
    added: any,
    hunk: sameIgnoringSpaces,
    reason: "Typo fix: missing space between words in the live policy text",
  },
  {
    kind: "text",
    pages: "/privacy-policy",
    removed: "-",
    reason: "Live writes list bullets as literal \"–\" characters; locally they are real list items",
  },
  {
    kind: "heading",
    pages: "/schedule-a-call",
    side: "live",
    match: "H2 Thank you for your interest in Oliant",
    reason: "Live page has no H1; its top heading is an H2. Locally it is the page H1",
  },
  {
    kind: "heading",
    pages: "/schedule-a-call",
    side: "local",
    match: "H1 Thank you for your interest in Oliant",
    reason: "Live page has no H1; its top heading is an H2. Locally it is the page H1",
  },
]
