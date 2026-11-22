import { readFileSync } from "node:fs"
import { join } from "node:path"

import Image from "next/image"
import Link from "next/link"

import { NewsletterForm } from "@/components/layout/NewsletterForm"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { home } from "@/content/home"
import { site } from "@/config/site"

const footer = home.footer
const phoneHref = `tel:${site.phone.replace(/[^\d+]/g, "")}`
const footerLogo = readFileSync(join(process.cwd(), "public/images/home/footer-logo.svg"), "utf8")

function FooterLink({ href, children }: { href: string; children: string }) {
  const className =
    "inline-block py-2 text-base leading-6 tracking-[0em] hover:text-[#9fc418] hover:underline"
  if (href.startsWith("http")) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        data-track={href === site.careersUrl ? "careers-click" : undefined}
      >
        <span className="trim-text">
          {children}
          <span className="sr-only"> (opens in a new tab)</span>
        </span>
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      <span className="trim-text">{children}</span>
    </Link>
  )
}

export type FooterTheme = "dark" | "light"

// Space between the previous section and the "Get in touch" card.
export type FooterSpace = "none" | "small" | "main"

const spaceClass: Record<FooterSpace, string> = {
  none: "",
  small: "h-[var(--size-5rem)]",
  main: "h-[var(--size-7rem)]",
}

export function Footer({ theme = "dark", space = "main" }: { theme?: FooterTheme; space?: FooterSpace }) {
  return (
    <footer
      className={`overflow-x-clip ${
        theme === "light" ? "bg-paper text-ink" : "bg-[linear-gradient(180deg,#45ab34,#142314)] text-paper"
      }`}
    >
      {space === "none" ? null : <div aria-hidden="true" className={spaceClass[space]} />}
      <div className="site-container relative">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,30rem),1fr))] gap-4">
          <div className="relative z-[1] flex flex-col justify-center gap-[var(--size-2rem)]">
            <Link
              href="/"
              aria-label="Home Page"
              className="inline-flex w-[15rem] shrink-0 [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: footerLogo }}
            />
            <nav
              aria-label="Footer"
              className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-4"
            >
              {footer.columns.map((column) => (
                <div key={column.title}>
                  <h4 className="trim-text mb-6 text-[1.25rem] leading-[1.1] font-extrabold tracking-[0em]">
                    {column.title}
                  </h4>
                  <ul className="flex flex-col gap-4">
                    {column.links.map((link) => (
                      <li key={link.label} className="whitespace-nowrap">
                        <FooterLink href={link.href}>{link.label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="w-[20rem] max-w-full">
              <Image
                src={footer.badge.src}
                alt={footer.badge.alt}
                width={footer.badge.width}
                height={footer.badge.height}
                className="h-auto w-full"
              />
            </div>
          </div>
          <div className="relative z-[1] rounded-tl-[3rem] bg-[#e1e3e1] px-12 py-24 text-ink max-[991px]:rounded-tr-[3rem] max-[991px]:p-12 max-[767px]:p-8">
            <h3 className="trim-text mb-6 text-[length:var(--size-2rem)] leading-[1.1] font-black tracking-[-0.03em]">
              {footer.formTitle}
            </h3>
            <p className="trim-text text-[1.25rem] leading-[1.5] tracking-[0em]">{footer.formText}</p>
            <div className="mt-[var(--size-2rem)] flex flex-wrap items-center gap-2">
              <ButtonLink href={footer.contactHref} variant="secondary" tone="onLight">
                {footer.contact}
              </ButtonLink>
              <ButtonLink href={footer.scheduleHref} tone="onLight">
                {footer.schedule}
              </ButtonLink>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[1.25rem] leading-[1.5]">
              <Image
                src="/images/home/icon-phone.svg"
                alt=""
                width={32}
                height={32}
                unoptimized
                className="size-8"
              />
              <a href={phoneHref}>{site.phone}</a>
            </p>
            <NewsletterForm />
            <div className="flex flex-col gap-2.5">
              <h5 className="text-[18px] leading-[25px] font-extrabold">{footer.socialTitle}</h5>
              <ul className="flex w-[192px] items-center gap-2">
                {footer.social.map((item) => (
                  <li key={item.label} className="flex-none max-[479px]:-mr-[3px]">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="flex size-12 items-center justify-center"
                    >
                      <Image src={item.icon} alt="" width={48} height={48} unoptimized className="size-12" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[55%] z-0 w-full bg-[#e1e3e1] max-[1050px]:hidden"
        />
      </div>
    </footer>
  )
}
