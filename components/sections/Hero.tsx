import Image from "next/image"

import { home } from "@/content/home"
import { HeroCurve } from "@/components/sections/HeroCurve"
import { ButtonLink } from "@/components/ui/ButtonLink"

const hero = home.hero

export function Hero() {
  return (
    <section className="relative -mt-[5.125rem] overflow-hidden bg-[linear-gradient(90deg,#366c2f,#2c3d2c_25%,#2c3d2c_30%,#45ab34)] text-paper">
      <div className="h-[var(--size-10rem)]" />
      <div className="site-container">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] items-center gap-4">
          <div className="relative aspect-[6.56/6.24] w-full overflow-hidden">
            <link rel="preload" as="image" href={hero.image.src} fetchPriority="high" />
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              preload
              fetchPriority="high"
              unoptimized
              sizes="(min-width: 73rem) 40rem, calc(100vw - 2.5rem)"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col items-start justify-center text-left">
            <h1 className="trim-display w-[10ch] font-display text-[length:var(--size-3-5rem)] leading-none font-black tracking-[0em] text-outline">
              {hero.title}
            </h1>
            <h2 className="trim-text mt-[var(--size-3rem)] mb-6 font-sans text-[length:var(--size-2rem)] leading-[1.1] font-black tracking-[-0.03em]">
              {hero.subtitle}
            </h2>
            <p className="trim-text text-pretty text-[1.25rem] leading-[1.5] font-medium tracking-[0em]">
              {hero.text}
            </p>
            <div className="mt-[var(--size-2rem)]">
              <ButtonLink href={hero.ctaHref}>{hero.cta}</ButtonLink>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[var(--size-14rem)]" />
      <HeroCurve />
    </section>
  )
}
