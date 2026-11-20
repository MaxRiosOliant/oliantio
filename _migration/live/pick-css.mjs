import { readFileSync, writeFileSync } from "node:fs"

const css = readFileSync(new URL("./webflow.css", import.meta.url), "utf8")
const needles = [
  ".nav_wrap",
  ".nav_contain",
  ".nav_logo",
  ".nav_links_link",
  ".nav_dropdown_toggle",
  ".btn_main_wrap",
  ".btn_main_text",
  ".u-container",
  ".u-grid-autofit",
  ".u-text-style-h2",
  ".u-text-style-h3",
  ".u-text-style-h5",
  ".u-text-style-display",
  ".u-text-style-large",
  ".u-text-style-main",
  ".u-text-style-small",
  ".work_card",
  ".work_background",
  ".process_wrap",
  ".process_timeline",
  ".process_timeline_square",
  ".process_timeline_divider",
  ".bloghome_wrap",
  ".blog_card",
  ".footer_wrap",
  ".footer_layout",
  ".footer_form",
  ".section_hero",
  ".g_section_space",
  ".outline-text",
  ".u-theme-dark",
  ".nav_btn",
  ".footer_form_field",
  ".footer_social",
  ".home-services_layout",
  ".work_layout",
  ".bloghome_layout",
]

const parts = css.split("}")
const hits = []
for (const part of parts) {
  if (needles.some((needle) => part.includes(needle))) {
    hits.push(`${part}}`)
  }
}
writeFileSync(new URL("./picked.css", import.meta.url), hits.join("\n\n"))
console.log("rules", hits.length, "chars", hits.join("").length)
