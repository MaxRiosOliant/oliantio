import Image from "next/image"

import { home } from "@/content/home"

const services = home.services

export function ServiceGrid() {
  return (
    <section className="bg-paper py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-ink">
      <div className="site-container">
        <h2 className="mb-8 text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em]">
          {services.title[0]}
          <br />
          {services.title[1]}
        </h2>
        <div className="grid gap-6 desk:grid-cols-2 desk:gap-16">
          {services.items.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl bg-linear-to-r from-brand-5 to-sky p-[2.4px]"
            >
              <div className="flex h-full flex-col gap-6 rounded-[0.8rem] bg-paper px-8 py-12 transition duration-500 hover:bg-linear-to-r hover:from-brand hover:via-brand-3 hover:to-brand-5 hover:shadow-[0_6px_10px_4px_rgba(0,0,0,0.15),0_2px_3px_rgba(0,0,0,0.3)] desk:px-16 desk:py-[5.5rem]">
                <Image src={item.icon} alt="" width={48} height={48} unoptimized className="size-12" />
                <h3 className="text-[clamp(1.75rem,1.678571rem+0.357143vw,2rem)] leading-[1.1] font-black tracking-[-0.03em]">
                  {item.title}
                </h3>
                <p className="max-w-lg text-base leading-6">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
