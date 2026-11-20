import Image from "next/image"

import { ButtonLink } from "@/components/ui/ButtonLink"

type ServiceHeroProps = {
  eyebrow: string
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
    <section className="bg-paper py-[clamp(3rem,2.428571rem+2.857143vw,5rem)] text-ink">
      <div className="site-container">
        <div className="grid items-center gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,25rem),1fr))]">
          <div className="flex flex-col items-start">
            <p className="mb-6 text-sm leading-5 font-semibold tracking-[0.2em] text-neutral-3 uppercase">
              {eyebrow}
            </p>
            <h1 className="mb-8 text-[clamp(2.375rem,2.053571rem+1.607143vw,3.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
              {title}
            </h1>
            <p className="text-xl leading-normal font-medium">{text}</p>
            <div className="mt-8">
              <ButtonLink href={ctaHref} tone="onLight">
                {cta}
              </ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[5.69/7] w-full overflow-hidden">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
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
