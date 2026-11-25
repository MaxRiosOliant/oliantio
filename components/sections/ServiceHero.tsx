import Image from "next/image"

import { ButtonLink } from "@/components/ui/ButtonLink"

type ServiceHeroProps = {
  eyebrow?: string
  title: string
  text: string
  cta: string
  ctaHref: string
  image: {
    src: string
    alt: string
  }
}

export function ServiceHero({
  eyebrow,
  title,
  text,
  cta,
  ctaHref,
  image,
}: ServiceHeroProps) {
  return (
    <section className="bg-paper pt-6 desk:pt-0 pb-[clamp(3rem,2.428571rem+2.857143vw,5rem)] text-ink">
      <div className="site-container">
        <div className="grid items-center gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,25rem),1fr))]">
          <div className="flex flex-col items-start">
            {eyebrow ? (
              <p className="trim-text mb-6 text-sm leading-5 font-semibold tracking-[0.2em] text-neutral-3 uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="trim-text mb-8 text-[clamp(2.375rem,2.053571rem+1.607143vw,3.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
              {title}
            </h1>
            <p className="trim-text text-xl leading-normal font-medium">{text}</p>
            <div className="mt-8">
              <ButtonLink href={ctaHref} tone="onLight">
                {cta}
              </ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[5.69/7] w-full overflow-hidden">
            <link rel="preload" as="image" href={image.src} fetchPriority="high" />
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload
              fetchPriority="high"
              unoptimized
              sizes="(min-width: 64rem) 36rem, calc(100vw - 2.5rem)"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
