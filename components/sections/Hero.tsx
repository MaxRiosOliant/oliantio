import Image from "next/image"

import { home } from "@/content/home"
import { ButtonLink } from "@/components/ui/ButtonLink"

const hero = home.hero

export function Hero() {
  return (
    <section className="home-hero relative overflow-hidden bg-[linear-gradient(90deg,#366c2f,#2c3d2c_25%,#2c3d2c_30%,#45ab34)] text-paper">
      <div className="h-[var(--size-10rem)]" />
      <div className="site-container">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] items-center gap-4">
          <div className="relative aspect-[6.56/6.24] w-full overflow-hidden">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              priority
              unoptimized
              sizes="(min-width: 73rem) 42rem, 100vw"
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[90px] overflow-hidden leading-none rotate-180">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block h-[90px] w-[calc(142%+1.3px)]"
          aria-hidden="true"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-paper"
          />
        </svg>
      </div>
    </section>
  )
}
