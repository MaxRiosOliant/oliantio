import { readFileSync } from "node:fs"
const html = readFileSync(new URL("../html/index.html", import.meta.url), "utf8")

function show(label, needle) {
  const at = html.indexOf(needle)
  const slice = html.slice(at - 20, at + needle.length + 30)
  const codes = [...slice].map((ch) =>
    ch === " " || ch.charCodeAt(0) > 126 ? `${JSON.stringify(ch)}:${ch.charCodeAt(0)}` : ch,
  )
  console.log("\n" + label)
  console.log(codes.join(""))
}

show("staff h3", "Staff")
const staffs = []
let from = 0
while (true) {
  const at = html.indexOf("Staff", from)
  if (at < 0) break
  staffs.push(html.slice(at, at + 24))
  from = at + 4
}
console.log("\nstaff occurrences", staffs.map((s) => JSON.stringify(s)))

show("it areas", "areas.")
show("privacy h", "Privacy, Security")
show("careers", "Careers")
