import Image from "next/image"

type ReasonItem = {
  title?: string
  text: string
  icon: string
}

type ReasonColumnsProps = {
  title: string
  text?: string
  image: {
    src: string
    alt: string
  }
  items: ReasonItem[]
}

export function ReasonColumns({ title, text, image, items }: ReasonColumnsProps) {
  return (
    <section className="bg-paper py-[clamp(4rem,3.142857rem+4.285714vw,7rem)] text-ink">
      <div className="site-container">
        <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,28rem),1fr))] min-[62rem]:[grid-template-columns:repeat(2,minmax(0,1fr))] min-[62rem]:gap-x-28 min-[62rem]:gap-y-8">
          <div className="min-[62rem]:col-start-1 min-[62rem]:row-start-1">
            <h2 className="trim-text text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
              {title}
            </h2>
            {text ? <p className="trim-text mt-6 text-base leading-6">{text}</p> : null}
          </div>
          <div className="relative hidden aspect-square w-full overflow-hidden rounded-2xl min-[62rem]:col-start-1 min-[62rem]:row-start-2 min-[62rem]:block min-[62rem]:self-start">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              unoptimized
              sizes="(min-width: 62rem) 36rem, 100vw"
              className="object-cover"
            />
          </div>
          <ul className="flex list-none flex-col gap-6 min-[62rem]:col-start-2 min-[62rem]:row-start-2 min-[62rem]:self-start">
            {items.map((item) => (
              <li
                key={item.title ?? item.text}
                className="rounded-2xl bg-linear-to-r from-brand-5 to-sky p-[2.4px]"
              >
                <div className="h-full rounded-[0.8rem] bg-paper p-[clamp(1.75rem,1.678571rem+0.357143vw,2rem)]">
                  <Image
                    src={item.icon}
                    alt=""
                    width={36}
                    height={37}
                    unoptimized
                    className="mb-6 h-8 w-8"
                  />
                  {item.title ? (
                    <h4 className="trim-text mb-6 text-2xl leading-[1.1] font-extrabold text-balance">
                      {item.title}
                    </h4>
                  ) : null}
                  <p className="trim-text text-base leading-6">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
