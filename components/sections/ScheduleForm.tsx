"use client"

import Image from "next/image"

import { buttonClassName } from "@/components/ui/ButtonLink"

type ScheduleFormProps = {
  nameLabel: string
  namePlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  messageLabel: string
  messagePlaceholder: string
  topicLabel: string
  topics: string[]
  submit: string
  image: {
    src: string
    alt: string
  }
}

const fieldClass =
  "block w-full border-0 border-b border-ink bg-transparent pt-2 text-xl leading-[1.5] text-ink placeholder:text-neutral-3 focus:border-brand-5 focus:outline-none"

export function ScheduleForm({
  nameLabel,
  namePlaceholder,
  emailLabel,
  emailPlaceholder,
  messageLabel,
  messagePlaceholder,
  topicLabel,
  topics,
  submit,
  image,
}: ScheduleFormProps) {
  return (
    <section className="bg-paper py-[var(--size-7rem)] text-ink">
      <div className="site-container">
        <div className="grid items-start gap-x-40 gap-y-16 [grid-template-columns:repeat(auto-fit,minmax(min(100%,28rem),1fr))]">
          {/* TODO: wire submission to the scheduling backend. */}
          <form
            className="flex flex-col gap-8"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="block">
              <span className="font-medium">{nameLabel}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                maxLength={256}
                placeholder={namePlaceholder}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="font-medium">{emailLabel}</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={256}
                placeholder={emailPlaceholder}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="font-medium">{messageLabel}</span>
              <textarea
                name="message"
                required
                maxLength={5000}
                rows={2}
                placeholder={messagePlaceholder}
                className={`${fieldClass} min-h-20 resize-y`}
              />
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">{topicLabel}</legend>
              {topics.map((topic) => (
                <label key={topic} className="flex items-center gap-3 font-medium">
                  <input
                    type="radio"
                    name="topic"
                    value={topic}
                    className="size-5 accent-brand-5"
                  />
                  {topic}
                </label>
              ))}
            </fieldset>
            <div>
              <button type="submit" className={buttonClassName({})}>
                {submit}
              </button>
            </div>
          </form>
          <div className="relative aspect-[592/563] w-full overflow-hidden rounded-2xl">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 62rem) 37rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
