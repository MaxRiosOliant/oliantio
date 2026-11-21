type CenteredIntroProps = {
  eyebrow?: string
  title: string
  paragraphs: string[]
}

export function CenteredIntro({ eyebrow, title, paragraphs }: CenteredIntroProps) {
  return (
    <section className="bg-paper py-[var(--size-7rem)] text-ink">
      <div className="site-container">
        <div className="mx-auto flex max-w-[53rem] flex-col items-center text-center">
          {eyebrow ? (
            <p className="trim-text mb-6 text-sm leading-normal font-semibold tracking-[0.2em] text-neutral-3 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="trim-text mb-6 max-w-[14ch] text-[length:var(--size-2-5rem)] leading-none font-black tracking-[-0.03em] text-balance">
            {title}
          </h2>
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-6 text-base leading-6 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
