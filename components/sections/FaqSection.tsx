type FaqSectionProps = {
  title: string
  text: string
}

export function FaqSection({ title, text }: FaqSectionProps) {
  return (
    <section className="bg-paper py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-ink">
      <div className="site-container">
        <h2 className="trim-text mb-6 text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
          {title}
        </h2>
        <p className="trim-text mb-[clamp(2.5rem,2.071429rem+2.142857vw,4rem)] text-base leading-6">
          {text}
        </p>
        <div aria-hidden="true" className="mb-10 flex" />
      </div>
    </section>
  )
}
