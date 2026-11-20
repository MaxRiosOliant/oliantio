import Image from "next/image"

import { home } from "@/content/home"

const reasons = home.reasons

const corners = [
  "rounded-tl-[8.125rem] rounded-tr-[8.125rem] rounded-bl-[8.125rem]",
  "rounded-tl-[8.125rem] rounded-tr-[8.125rem] rounded-br-[8.125rem]",
  "rounded-tl-[8.125rem] rounded-br-[8.125rem] rounded-bl-[8.125rem]",
  "rounded-tr-[8.125rem] rounded-br-[8.125rem] rounded-bl-[8.125rem]",
]

export function WhyWorkWithUs() {
  return (
    <section className="relative overflow-hidden rounded-tr-[15rem] bg-neutral-1 py-[clamp(5.5rem,4.214286rem+6.428571vw,10rem)] text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/images/home/wordmark.svg')] bg-left-top bg-no-repeat"
      />
      <div className="site-container relative">
        <h2 className="mb-16 text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em]">
          {reasons.title}
        </h2>
        <div className="grid gap-8 desk:grid-cols-2 desk:gap-[5.5rem]">
          {reasons.items.map((item, index) => (
            <article
              key={item.title}
              className={`flex flex-col gap-4 bg-paper px-8 py-10 desk:px-[6.5rem] desk:py-12 ${corners[index]}`}
            >
              <div className="flex items-center gap-4">
                <Image
                  src={item.icon}
                  alt=""
                  width={36}
                  height={37}
                  unoptimized
                  className="h-9 w-auto shrink-0"
                />
                <h3 className="text-[clamp(1.75rem,1.678571rem+0.357143vw,2rem)] leading-[1.1] font-black tracking-[-0.03em]">
                  {item.title}
                </h3>
              </div>
              <p className="text-base leading-6">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
