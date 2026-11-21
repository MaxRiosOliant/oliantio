import { ButtonLink } from "@/components/ui/ButtonLink"

type CtaBandProps = {
  title: string
  text: string
  cta: string
  ctaHref: string
  layout?: "split" | "centered"
}

export function CtaBand({ title, text, cta, ctaHref, layout = "split" }: CtaBandProps) {
  if (layout === "centered") {
    return (
      <section className="bg-[linear-gradient(#142314,#45ab34)] py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-paper">
        <div className="site-container">
          <div className="flex flex-col items-center text-center">
            <h2 className="trim-text mb-6 max-w-[20ch] text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] whitespace-pre-line text-balance">
              {title}
            </h2>
            <p className="trim-text max-w-[40rem] text-base leading-6">{text}</p>
            <ButtonLink href={ctaHref} variant="secondary" className="mt-[var(--size-2rem)]">
              {cta}
            </ButtonLink>
          </div>
        </div>
      </section>
    )
  }

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
