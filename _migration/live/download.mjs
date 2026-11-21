// Downloads remote assets into public/. Skips files that already exist.
// node _migration/live/download.mjs   (edit the list below)
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const cdn = "https://cdn.prod.website-files.com/67acdc2e43fd0a75670a1516/"
const formCdn = "https://cdn.prod.website-files.com/64d3fa3fc7702dfde32fdda1/"

const heroes = {
  web: "67c8b11111f9444d855d620f_software_web_vectors_resized.svg",
  react: "67d06c065fe6429ef96d0e5b_software_react_resized.svg",
  angular: "67ce44d601d349412dab41e6_software_dotnet_resized.svg",
  net: "67ce44d601d349412dab41e6_software_dotnet_resized.svg",
}

const assets = [
  ...Object.entries(heroes).flatMap(([slug, file]) => [
    [cdn + file, `images/services/${slug}/hero.svg`],
    [cdn + "67c7226d53252c33b87cd28e_software_qa_why_oliant_resized.svg", `images/services/${slug}/why-oliant.svg`],
    [cdn + "67c7258a283ba29004f5ab67_shutterstock_2279184929_resized.svg", `images/services/${slug}/closing.svg`],
  ]),
  [cdn + "67b70e4f45e919d5b1c75361_Chicago.webp", "images/pages/contact-us/chicago.webp"],
  [cdn + "67b70e4f8e5a8b1e1e3440b1_Sofia.webp", "images/pages/contact-us/sofia.webp"],
  [cdn + "67b70e4fce21dbf3a2e10880_BuenosAires.webp", "images/pages/contact-us/buenos-aires.webp"],
  [cdn + "67b1e53f5b3e0e9c63a5f2f4_post1.avif", "images/pages/schedule-a-call/schedule.avif"],
  [formCdn + "6658806aac5b6e6e5986e49d_4-VARIABLE-2-Horizontal---Desaturation-1080x1080px.webp", "images/pages/oliant-form-usa/logo.webp"],
  [formCdn + "66c8e67d418de042ca207be0_image%206%20(1).png", "images/pages/oliant-form-usa/pattern.png"],
  [formCdn + "6516b287f0fd3371a7556e74_header%20background-poster-00001.jpg", "images/pages/oliant-form-usa/background.jpg"],
]

for (const [url, target] of assets) {
  const file = path.join(root, "public", target)
  if (existsSync(file)) {
    console.log("skip", target)
    continue
  }
  const response = await fetch(url)
  if (!response.ok) {
    console.error("FAIL", response.status, url)
    process.exitCode = 1
    continue
  }
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, Buffer.from(await response.arrayBuffer()))
  console.log("ok", target, response.headers.get("content-type"))
}
