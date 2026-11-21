"use client"

import { useId, useState } from "react"
import Link from "next/link"

type FaqPart = {
  text: string
  href?: string
}

type FaqItem = {
  question: string
  parts: FaqPart[]
}

type FaqSectionProps = {
  title: string
  text?: string
  items?: FaqItem[]
}

export function FaqSection({ title, text, items }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState(0)
  const baseId = useId()

  return (
    <section className="bg-paper py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-ink">
      <div className="site-container">
        <h2 className="trim-text mb-6 text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
          {title}
        </h2>
        {text ? (
          <p
            className={`trim-text text-base leading-6 ${items ? "mb-16" : "mb-[clamp(2.5rem,2.071429rem+2.142857vw,4rem)]"}`}
          >
            {text}
          </p>
        ) : null}
        {items ? (
          <div className={`mb-10 flex flex-col gap-4 ${text ? "" : "pt-16"}`}>
            {items.map((item, index) => {
              const open = openIndex === index
              const panelId = `${baseId}-${index}`
              return (
                <div key={item.question} className="border-t border-black">
                  <h3 className="text-base leading-[1.3] font-extrabold">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 pr-4 text-left"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(open ? -1 : index)}
                    >
                      {item.question}
                      <Chevron open={open} />
                    </button>
                  </h3>
                  <div id={panelId} hidden={!open} className="pr-4 pt-4 pb-5">
                    <p className="text-base leading-6">
                      {item.parts.map((part, partIndex) =>
                        part.href ? (
                          <Link
                            key={partIndex}
                            href={part.href}
                            className="text-ink underline"
                          >
                            {part.text}
                          </Link>
                        ) : (
                          part.text
                        ),
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div aria-hidden="true" className="mb-10 flex" />
        )}
      </div>
    </section>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 18 11"
      aria-hidden="true"
      className={`h-[1.2rem] w-[1.2rem] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M17 9.56787L9 1.56787L1 9.56787"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
