export const contactTopicSlugs = [
  "web-development",
  "staff-augmentation",
  "custom-development",
  "mvp-development",
  "qa-testing",
  "cloud",
  "digital-marketing-seo",
  "other",
] as const

export type ContactTopicSlug = (typeof contactTopicSlugs)[number]

export const contactTopicLabels: Record<ContactTopicSlug, string> = {
  "web-development": "Web Development",
  "staff-augmentation": "Staff Augmentation",
  "custom-development": "Custom Development",
  "mvp-development": "MVP Development",
  "qa-testing": "QA & Testing",
  cloud: "Cloud (Google Cloud, AWS, Azure)",
  "digital-marketing-seo": "Digital Marketing & SEO",
  other: "Other",
}

export const contactTopics = contactTopicSlugs.map((slug) => ({
  slug,
  label: contactTopicLabels[slug],
}))

export function contactTopicLabel(slug: string) {
  if (isContactTopic(slug)) return contactTopicLabels[slug]
  return ""
}

export function isContactTopic(slug: string): slug is ContactTopicSlug {
  return (contactTopicSlugs as readonly string[]).includes(slug)
}

// Technology pages share a topic: cloud platforms use Cloud, and the other
// development pages use Custom Development.
const serviceContactTopics: Record<string, ContactTopicSlug> = {
  "/services/web": "web-development",
  "/services/staff-augmentation": "staff-augmentation",
  "/services/custom-development": "custom-development",
  "/services/mvp-development": "mvp-development",
  "/services/qa": "qa-testing",
  "/services/digital-marketing-seo": "digital-marketing-seo",
  "/services/development/google-cloud-platform": "cloud",
  "/services/development/aws": "cloud",
  "/services/development/microsoft-azure": "cloud",
  "/services/development/net": "custom-development",
  "/services/development/java": "custom-development",
  "/services/development/node": "custom-development",
  "/services/development/python": "custom-development",
  "/services/development/react": "custom-development",
  "/services/development/angular": "custom-development",
  "/services/development/webflow": "custom-development",
  "/services/development/wordpress": "custom-development",
}

export function contactHrefForPath(pathname: string) {
  const path = pathname.split(/[?#]/)[0]?.replace(/\/+$/, "") || "/"
  const topic = serviceContactTopics[path]
  return topic ? `/contact-us?topic=${topic}` : "/contact-us"
}
