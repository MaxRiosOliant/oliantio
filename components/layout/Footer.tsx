import Image from "next/image"
import Link from "next/link"

import { Logo } from "@/components/layout/Logo"
import { NewsletterForm } from "@/components/layout/NewsletterForm"
import { ButtonLink } from "@/components/ui/ButtonLink"
import { home } from "@/content/home"
import { site } from "@/config/site"

const footer = home.footer
const phoneHref = `tel:${site.phone.replace(/[^\d+]/g, "")}`

function FooterLink({ href, children }: { href: string; children: string }) {
  const className = "text-base leading-6 hover:underline"
  if (href.startsWith("http")) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="bg-[linear-gradient(#45ab34,#142314)] text-paper">
      <div className="site-container py-16 desk:py-24">
        <div className="grid gap-12 desk:grid-cols-2 desk:gap-10">
          <div className="flex flex-col gap-8">
            <Logo variant="footer" />
            <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
              {footer.columns.map((column) => (
                <div key={column.title}>
                  <h4 className="mb-4 text-xl leading-normal font-black tracking-[-0.03em]">
                    {column.title}
                  </h4>
                  <ul className="flex flex-col gap-4">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <FooterLink href={link.href}>{link.label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <Image
              src={footer.badge.src}
              alt={footer.badge.alt}
              width={220}
              height={80}
              className="h-16 w-auto"
            />
          </div>
          <div className="rounded-tl-[3rem] bg-paper/90 p-8 text-ink desk:px-12 desk:py-24">
            <h3 className="text-[clamp(1.75rem,1.678571rem+0.357143vw,2rem)] leading-[1.1] font-black tracking-[-0.03em]">
              {footer.formTitle}
            </h3>
            <p className="mt-4 text-xl leading-normal">{footer.formText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={footer.contactHref} variant="secondary" tone="onLight">
                {footer.contact}
              </ButtonLink>
              <ButtonLink href={footer.scheduleHref} tone="onLight">
                {footer.schedule}
              </ButtonLink>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xl leading-normal">
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
            <div className="mt-8 flex flex-col gap-2.5">
              <h5 className="text-lg leading-[25px] font-extrabold">{footer.socialTitle}</h5>
              <ul className="flex w-48 items-center gap-2">
                {footer.social.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                      <Image src={item.icon} alt="" width={32} height={32} unoptimized className="size-8" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
