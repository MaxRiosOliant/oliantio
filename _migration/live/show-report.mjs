// Prints the unexplained differences from _migration/report/report.json.
// node _migration/live/show-report.mjs [pathFilter] [--all]
import { readFileSync } from "node:fs"

const results = JSON.parse(readFileSync(new URL("../report/report.json", import.meta.url), "utf8"))
const filter = process.argv.slice(2).find((arg) => !arg.startsWith("--"))
const all = process.argv.includes("--all")
const clip = (value, n = 220) => (value.length > n ? value.slice(0, n) + `…(${value.length})` : value)

for (const result of results.sort((a, b) => a.path.localeCompare(b.path))) {
  if (filter && !result.path.includes(filter)) continue
  const text = result.text.filter((hunk) => all || !hunk.reason)
  const items = result.items.filter((diff) => all || !diff.reason)
  if (!text.length && !items.length && !result.error) continue
  console.log(`\n=== ${result.path} ${result.status}${result.error ? " ERROR " + result.error : ""}`)
  for (const hunk of text) {
    console.log(`  TEXT …${clip(hunk.before, 60)} [-${clip(hunk.removed)}-] {+${clip(hunk.added)}+} ${clip(hunk.after, 60)}…${hunk.reason ? "  (ok)" : ""}`)
  }
  for (const diff of items) {
    console.log(`  ${diff.kind} ${diff.side}: ${clip(diff.item)}${diff.reason ? "  (ok)" : ""}`)
    if (diff.kind === "image-count" && result.imageFiles) {
      console.log(`    live:  ${result.imageFiles.live.join(" | ")}`)
      console.log(`    local: ${result.imageFiles.local.join(" | ")}`)
    }
  }
}
