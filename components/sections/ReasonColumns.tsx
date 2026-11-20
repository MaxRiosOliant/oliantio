import Image from "next/image"

type ReasonItem = {
  title: string
  text: string
  icon: string
}

type ReasonColumnsProps = {
  title: string
  text: string
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
        <div className="grid items-stretch gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,28rem),1fr))] min-[62rem]:gap-28">
          <div className="flex h-full flex-col justify-between gap-8">
            <div>
              <h2 className="mb-6 text-[clamp(2rem,1.857143rem+0.714286vw,2.5rem)] leading-none font-black tracking-[-0.03em] text-balance">
                {title}
              </h2>
              <p className="text-base leading-6">{text}</p>
            </div>
            <div className="relative hidden aspect-square overflow-hidden rounded-2xl min-[62rem]:block">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                unoptimized
                sizes="(min-width: 62rem) 36rem, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          <ul className="flex list-none flex-col gap-6">
            {items.map((item) => (
              <li
                key={item.title}
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
                  <h4 className="mb-6 text-2xl leading-[1.1] font-extrabold text-balance">
                    {item.title}
                  </h4>
                  <p className="text-base leading-6">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
