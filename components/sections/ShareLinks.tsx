import type { ReactNode } from "react"

import { blog } from "@/content/blog"

type ShareLinksProps = {
  url: string
  title: string
}

const icons: Record<keyof typeof blog.article.share, ReactNode> = {
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v6h4v-6h3l1-4h-4V8z" />,
  whatsapp: (
    <>
      <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z" />
    </>
  ),
  linkedin: (
    <>
      <path d="M5 10v9M5 5v.5M10 19v-9M10 13.5a3.5 3.5 0 0 1 7 0V19" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
}

export function ShareLinks({ url, title }: ShareLinksProps) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  const hrefs: Record<keyof typeof icons, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?caption=${t}&u=${u}`,
    whatsapp: `whatsapp://send?text=${t}%20${u}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${u}&title=${t}`,
    x: `https://x.com/intent/tweet?text=${t}&url=${u}`,
    email: `mailto:?subject=${t}&body=${t}%20${u}`,
  }
  const keys = Object.keys(icons) as Array<keyof typeof icons>

  return (
    <ul
      aria-label={blog.article.shareLabel}
      className="ml-auto flex w-fit items-center gap-1 rounded-[0.25rem] bg-[linear-gradient(90deg,#e1f3dd,#d8f0d2)] px-1"
    >
      {keys.map((key) => (
        <li key={key}>
          <a
            href={hrefs[key]}
            aria-label={blog.article.share[key]}
            target={key === "email" || key === "whatsapp" ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="flex size-8 items-center justify-center text-ink hover:text-brand-5"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icons[key]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
