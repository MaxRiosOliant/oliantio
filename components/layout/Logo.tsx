import Image from "next/image"
import Link from "next/link"

type LogoProps = {
  variant?: "header" | "footer"
}

export function Logo({ variant = "header" }: LogoProps) {
  const footer = variant === "footer"
  const src = footer ? "/images/home/footer-logo.svg" : "/images/home/logo.svg"

  return (
    <Link href="/" aria-label="Home Page" className="inline-flex shrink-0">
      <Image
        src={src}
        alt=""
        width={footer ? 240 : 132}
        height={footer ? 64 : 28}
        unoptimized
        className={footer ? "h-16 w-auto" : "h-7 w-auto"}
        style={{ filter: "brightness(0) invert(1)" }}
      />
    </Link>
  )
}
