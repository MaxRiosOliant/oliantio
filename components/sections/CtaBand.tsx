import { ButtonLink } from "@/components/ui/ButtonLink"

type CtaBandProps = {
  title: string
  text: string
  cta: string
  ctaHref: string
}

export function CtaBand({ title, text, cta, ctaHref }: CtaBandProps) {
  return (
    <section className="bg-ink py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-paper">
      <div className="site-container">
        <div className="flex flex-col items-center min-[62rem]:flex-row min-[62rem]:items-center min-[62rem]:justify-between">
          <div>
            <h2 className="trim-text mb-6 max-w-[28ch] text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
              {title}
            </h2>
            <p className="trim-text max-w-[60ch] text-base leading-6">{text}</p>
          </div>
          <ButtonLink href={ctaHref} className="mt-[var(--size-2rem)]">
            {cta}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
