import Image from "next/image"

type Office = {
  city: string
  country: string
  address: string
  phone: string
  email: string
  image: {
    src: string
    alt: string
  }
}

type OfficeCardsProps = {
  title: string
  offices: Office[]
}

export function OfficeCards({ title, offices }: OfficeCardsProps) {
  return (
    <section className="bg-paper py-[var(--size-7rem)] text-ink">
      <div className="site-container">
        <h2 className="trim-text mb-16 max-w-[14ch] text-[length:var(--size-2-5rem)] leading-none font-black tracking-[-0.03em] text-balance">
          {title}
        </h2>
        <ul className="grid list-none gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
          {offices.map((office) => (
            <li
              key={office.city}
              className="flex flex-col overflow-hidden rounded-2xl bg-[linear-gradient(#5ab12d,#45ab34)] text-paper"
            >
              <div className="relative aspect-[437/288] w-full">
                <Image
                  src={office.image.src}
                  alt={office.image.alt}
                  fill
                  sizes="(min-width: 62rem) 33vw, (min-width: 48rem) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="trim-text mb-6 text-2xl leading-[1.1] font-medium">
                  <strong className="font-extrabold">{office.city},</strong> {office.country}
                </h3>
                <p className="text-base leading-6">
                  <strong className="font-bold">{office.address}</strong>
                  <br />
                  {office.phone}
                  <br />
                  {office.email}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
