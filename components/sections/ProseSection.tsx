import type { ReactNode } from "react"

type ProseSectionProps = {
  title: string
  meta?: string
  children: ReactNode
}

export function ProseSection({ title, meta, children }: ProseSectionProps) {
  return (
    <section className="bg-paper py-[var(--size-7rem)] text-ink">
      <div className="site-container">
        <h2 className="trim-text mb-6 text-[length:var(--size-2-5rem)] leading-none font-black tracking-[-0.03em] text-balance">
          {title}
        </h2>
        {meta ? <p className="mb-16 text-base leading-6 italic">{meta}</p> : null}
        <div className="text-base leading-6 [&_a]:text-brand-5 [&_a]:underline [&_h3]:mt-10 [&_h3]:mb-6 [&_h3]:text-2xl [&_h3]:leading-[1.1] [&_h3]:font-extrabold [&_li]:mb-2 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </div>
    </section>
  )
}
