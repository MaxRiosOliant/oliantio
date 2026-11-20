import Image from "next/image"

import { ButtonLink } from "@/components/ui/ButtonLink"

type ClosingCtaProps = {
  title: string
  text: string
  cta: string
  ctaHref: string
  image: {
    src: string
    alt: string
  }
}

export function ClosingCta({ title, text, cta, ctaHref, image }: ClosingCtaProps) {
  return (
    <section className="bg-[linear-gradient(#142314,#45ab34)] py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-paper">
      <div className="site-container">
        <div className="grid items-center gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,25rem),1fr))]">
          <div className="flex flex-col items-start">
            <h2 className="mb-6 text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
              {title}
            </h2>
            <p className="text-base leading-6">{text}</p>
            <div className="mt-8">
              <ButtonLink href={ctaHref}>{cta}</ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[5.6/4] w-full overflow-hidden">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              unoptimized
              sizes="(min-width: 50rem) 42rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
