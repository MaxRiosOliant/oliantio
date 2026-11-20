import Link from "next/link"

type ButtonLinkProps = {
  href: string
  children: string
  variant?: "primary" | "secondary"
  tone?: "onDark" | "onLight"
  className?: string
}

export function buttonClassName({
  variant = "primary",
  tone = "onDark",
  className = "",
}: Omit<ButtonLinkProps, "href" | "children">) {
  const shape =
    "inline-flex items-center justify-center rounded-2xl py-5 text-xl leading-none font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
  const padding = variant === "secondary" ? "px-8" : "px-10"
  const color =
    variant === "primary"
      ? tone === "onLight"
        ? "bg-linear-to-r from-brand via-brand-3 to-brand-5 text-ink hover:from-ink hover:via-ink hover:to-ink hover:text-paper"
        : "bg-linear-to-r from-brand via-brand-3 to-brand-5 text-ink hover:from-paper hover:via-paper hover:to-paper"
      : tone === "onLight"
        ? "border border-ink text-ink hover:bg-ink hover:text-paper"
        : "border border-paper text-paper hover:bg-paper hover:text-ink"

  return [shape, padding, color, className].filter(Boolean).join(" ")
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  tone = "onDark",
  className,
}: ButtonLinkProps) {
  const classes = buttonClassName({ variant, tone, className })

  if (href.startsWith("http")) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}
