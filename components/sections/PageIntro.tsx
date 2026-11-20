type PageIntroProps = {
  title: string
  description?: string
}

export function PageIntro({ title, description }: PageIntroProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-7">{description}</p>
      ) : null}
    </section>
  )
}
