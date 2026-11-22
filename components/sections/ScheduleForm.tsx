"use client"

import Image from "next/image"
import type { FormEvent } from "react"

import { FieldError, FormBanner, Honeypot, Spinner, useFormSubmit } from "@/components/forms/FormControls"
import { buttonClassName } from "@/components/ui/ButtonLink"
import { formNames } from "@/lib/forms/messages"

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
  const { fieldErrors, sending, submit: send, banner } = useFormSubmit(formNames.schedule)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    await send("/api/forms/schedule-a-call", {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      topic: String(data.get("topic") ?? ""),
      hp_field: String(data.get("hp_field") ?? ""),
    })
  }

  return (
    <section className="bg-paper py-[var(--size-7rem)] text-ink">
      <div className="site-container">
        <div className="grid items-start gap-x-40 gap-y-16 [grid-template-columns:repeat(auto-fit,minmax(min(100%,28rem),1fr))]">
          <form className="relative flex flex-col gap-8" onSubmit={onSubmit} noValidate>
            <Honeypot />
            <label className="block">
              <span className="font-medium">{nameLabel}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                maxLength={256}
                placeholder={namePlaceholder}
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={fieldErrors.name ? "schedule-name-error" : undefined}
                className={fieldClass}
              />
              <FieldError id="schedule-name-error" message={fieldErrors.name} />
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
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? "schedule-email-error" : undefined}
                className={fieldClass}
              />
              <FieldError id="schedule-email-error" message={fieldErrors.email} />
            </label>
            <label className="block">
              <span className="font-medium">{messageLabel}</span>
              <textarea
                name="message"
                required
                maxLength={5000}
                rows={2}
                placeholder={messagePlaceholder}
                aria-invalid={fieldErrors.message ? true : undefined}
                aria-describedby={fieldErrors.message ? "schedule-message-error" : undefined}
                className={`${fieldClass} min-h-20 resize-y`}
              />
              <FieldError id="schedule-message-error" message={fieldErrors.message} />
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
              <FieldError id="schedule-topic-error" message={fieldErrors.topic} />
            </fieldset>
            <div>
              <button
                type="submit"
                disabled={sending}
                aria-busy={sending}
                className={buttonClassName({ className: "gap-2 disabled:opacity-70" })}
              >
                {sending ? <Spinner /> : null}
                {submit}
              </button>
              <FormBanner kind={banner} className="mt-4 text-base" />
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
