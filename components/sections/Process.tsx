import Image from "next/image"

import { home } from "@/content/home"
import { ButtonLink } from "@/components/ui/ButtonLink"

const process = home.process

export function Process() {
  return (
    <section className="bg-paper bg-[url('/images/home/pattern.svg')] bg-cover bg-center py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-ink">
      <div className="site-container">
        <div className="grid items-start gap-12 desk:grid-cols-2 desk:gap-16">
          <div className="flex flex-col items-start gap-8">
            <div>
              <h2 className="text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em]">
                {process.title}
              </h2>
              <p className="mt-6 text-xl leading-normal font-medium">{process.text}</p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={process.image.src}
                alt={process.image.alt}
                fill
                sizes="(min-width: 73rem) 40rem, 100vw"
                className="object-contain object-left"
              />
            </div>
            <ButtonLink href={process.ctaHref}>{process.cta}</ButtonLink>
          </div>
          <ol className="flex gap-8 pt-4 desk:pt-10">
            <li className="flex flex-col items-center" aria-hidden="true">
              {process.steps.map((step, index) => (
                <span key={step.title} className="flex flex-col items-center">
                  <span className="size-7 rounded-sm bg-brand-4" />
                  {index < process.steps.length - 1 ? (
                    <span className="h-[5.4rem] w-[1.2px] bg-ink" />
                  ) : null}
                </span>
              ))}
            </li>
            <li className="flex flex-1 flex-col">
              {process.steps.map((step) => (
                <div key={step.title} className="min-h-[7.15rem]">
                  <h3 className="text-[clamp(1.75rem,1.678571rem+0.357143vw,2rem)] leading-[1.1] font-black tracking-[-0.03em]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-xl leading-normal">{step.text}</p>
                </div>
              ))}
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
