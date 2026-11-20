import Image from "next/image"

import { home } from "@/content/home"
import { ButtonLink } from "@/components/ui/ButtonLink"

const hero = home.hero

export function Hero() {
  return (
    <section className="home-hero relative overflow-hidden bg-[linear-gradient(90deg,#366c2f,#2c3d2c_25%,#2c3d2c_30%,#45ab34)] pt-[clamp(5.5rem,4.214286rem+6.428571vw,10rem)] pb-[clamp(7rem,5rem+10vw,14rem)] text-paper">
      <div className="site-container">
        <div className="grid items-center gap-10 desk:grid-cols-2 desk:gap-8">
          <div className="relative mx-auto w-full max-w-xl desk:max-w-none">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              width={hero.image.width}
              height={hero.image.height}
              priority
              unoptimized
              className="h-56 w-auto max-w-full object-contain object-left desk:h-auto desk:w-full"
            />
          </div>
          <div className="flex flex-col items-start justify-center">
            <h1 className="w-[10ch] font-display text-[clamp(2.375rem,2.053571rem+1.607143vw,3.5rem)] leading-none font-black text-outline">
              {hero.title}
            </h1>
            <h2 className="mt-8 text-[clamp(1.75rem,1.678571rem+0.357143vw,2rem)] leading-[1.1] font-black tracking-[-0.03em]">
              {hero.subtitle}
            </h2>
            <p className="mt-4 max-w-xl text-xl leading-normal font-medium">{hero.text}</p>
            <div className="mt-8">
              <ButtonLink href={hero.ctaHref}>{hero.cta}</ButtonLink>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[90px] overflow-hidden leading-none rotate-180">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block h-[90px] w-[142%]"
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
