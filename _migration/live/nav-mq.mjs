import { readFileSync } from "node:fs"

const css = readFileSync(new URL("./webflow.css", import.meta.url), "utf8")
const indexes = []
let from = 0
while (true) {
  const at = css.indexOf("nav_wrap.is-desktop", from)
  if (at < 0) break
  indexes.push(at)
  from = at + 10
}
console.log("hits", indexes.length)
for (const at of indexes) {
  const media = css.lastIndexOf("@media", at)
  const mediaEnd = css.indexOf("{", media)
  console.log("\n---", at)
  console.log("media", media > at - 400 ? css.slice(media, mediaEnd) : "none nearby")
  console.log(css.slice(at, at + 220))
}

const sizes = ["--size--0-25rem", "--size--0-5rem", "--size--0-75rem", "--size--1rem", "--size--1-25rem", "--size--1-5rem", "--size--2-5rem", "--size--3rem", "--size--4rem", "--size--5rem", "--size--6-5rem", "--size--7rem", "--size--10rem", "--size--14rem"]
for (const name of sizes) {
  const at = css.indexOf(`${name}:`)
  console.log(name, css.slice(at, at + 80))
}
