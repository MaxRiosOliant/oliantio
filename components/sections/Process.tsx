import Image from "next/image"

import { home } from "@/content/home"
import { ButtonLink } from "@/components/ui/ButtonLink"

const process = home.process
const dividerClass = ["process-divider-1", "process-divider-2", "process-divider-3"]

export function Process() {
  return (
    <section className="bg-paper bg-[url('/images/home/oliant-trama.svg')] bg-[length:auto] bg-[position:100%_0] bg-no-repeat py-[var(--size-7rem)] text-ink">
      <div className="site-container">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))] items-start gap-[var(--size-4rem)]">
          <div className="flex flex-col items-end gap-[var(--size-2rem)] max-[767px]:items-start">
            <div className="w-full">
              <h2 className="trim-text mb-[var(--size-2rem)] text-[length:var(--size-2-5rem)] leading-none font-black tracking-[-0.03em]">
                {process.title}
              </h2>
              <p className="trim-text mb-4 text-[1.25rem] leading-[1.5] font-medium tracking-[0em]">
                {process.text}
              </p>
            </div>
            <div className="relative aspect-[8.24/5.21] w-full overflow-hidden max-[767px]:hidden">
              <Image
                src={process.image.src}
                alt={process.image.alt}
                fill
                sizes="(min-width: 73rem) 40rem, 100vw"
                className="object-cover"
              />
            </div>
            <ButtonLink href={process.ctaHref}>{process.cta}</ButtonLink>
          </div>
          <div className="flex gap-8 pt-10 max-[767px]:gap-4 max-[767px]:pt-4 max-[479px]:gap-4">
            <div className="flex flex-col items-center" aria-hidden="true">
              {process.steps.map((step, index) => (
                <span key={step.title} className="flex flex-col items-center">
                  <span className="size-7 rounded-sm bg-brand-4" />
                  {index < process.steps.length - 1 ? (
                    <span className={`process-divider ${dividerClass[index] ?? ""}`} />
                  ) : null}
                </span>
              ))}
            </div>
            <div className="process-steps flex flex-col gap-8">
              {process.steps.map((step) => (
                <div key={step.title} className="process-step-copy flex flex-col">
                  <h3 className="process-step-title trim-text">{step.title}</h3>
                  <p className="process-step-text trim-text">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
