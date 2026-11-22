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
    "inline-flex items-center justify-center rounded-2xl py-0 text-xl leading-none font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
  // The secondary border sits outside the 55px button body, as on live.
  const padding =
    variant === "secondary" ? "h-[57px] px-[var(--size-2rem)]" : "h-[55px] px-[var(--size-2-5rem)]"
  const color =
    variant === "primary"
      ? "bg-[linear-gradient(90deg,#9fc418,#87bd1f_25%,#71b726_50%,#5ab12d_75%,#45ab34)] text-ink hover:bg-[linear-gradient(-90deg,#9fc418,#87bd1f_25%,#71b726_50%,#5ab12d_75%,#45ab34)]"
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
