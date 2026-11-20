import Image from "next/image"

type ServiceCatalogItem = {
  title: string
  icon: string
  paragraphs: string[]
}

type ServiceCatalogProps = {
  title: string
  intro: string
  items: ServiceCatalogItem[]
}

export function ServiceCatalog({ title, intro, items }: ServiceCatalogProps) {
  return (
    <section className="bg-paper py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-ink">
      <div className="site-container">
        <h2 className="mb-6 text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
          {title}
        </h2>
        <p className="max-w-[60ch] text-base leading-6">{intro}</p>
        <ul className="mt-[clamp(2.5rem,2.071429rem+2.142857vw,4rem)] grid list-none gap-[clamp(1.75rem,1.678571rem+0.357143vw,2rem)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,30rem),1fr))]">
          {items.map((item) => (
            <li key={item.title} className="flex items-start gap-6">
              <Image
                src={item.icon}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="size-8 shrink-0"
              />
              <div>
                <h3 className="mb-6 text-xl leading-[1.1] font-extrabold text-balance">
                  {item.title}
                </h3>
                {item.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-3 text-base leading-6 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
