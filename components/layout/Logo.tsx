import Image from "next/image"
import Link from "next/link"

type LogoProps = {
  variant?: "header" | "footer"
}

export function Logo({ variant = "header" }: LogoProps) {
  const footer = variant === "footer"

  return (
    <Link href="/" aria-label="Home Page" className="inline-flex shrink-0 text-paper">
      <Image
        src={footer ? "/images/home/footer-logo.svg" : "/images/home/logo.svg"}
        alt=""
        width={footer ? 390 : 132}
        height={footer ? 116 : 28}
        unoptimized
        className={footer ? "h-auto w-[15rem]" : "h-7 w-[8.25rem]"}
      />
    </Link>
  )
}
