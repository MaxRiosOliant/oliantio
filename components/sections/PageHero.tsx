import { HeroCurve } from "@/components/sections/HeroCurve"
import { ButtonLink } from "@/components/ui/ButtonLink"

type PageHeroProps = {
  title: string
  text: string
  cta?: string
  ctaHref?: string
}

export function PageHero({ title, text, cta, ctaHref }: PageHeroProps) {
  return (
    <section className="relative -mt-[5.125rem] overflow-hidden bg-[linear-gradient(90deg,#366c2f,#2c3d2c_25%,#2c3d2c_30%,#45ab34)] py-[var(--size-10rem)] text-paper">
      <div className="site-container relative">
        <div className="flex max-w-[43rem] flex-col items-start">
          <h1 className="trim-display font-display text-[length:var(--size-3-5rem)] leading-none font-black tracking-[0em] whitespace-pre-line text-outline">
            {title}
          </h1>
          <p className="trim-text mt-6 text-[1.25rem] leading-[1.5]">{text}</p>
          {cta && ctaHref ? (
            <div className="mt-[var(--size-2rem)]">
              <ButtonLink href={ctaHref}>{cta}</ButtonLink>
            </div>
          ) : null}
        </div>
      </div>
      <HeroCurve />
    </section>
  )
}
