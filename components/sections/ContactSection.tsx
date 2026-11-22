"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import type { FormEvent } from "react"

import { FieldError, FormBanner, Honeypot, Spinner, useFormSubmit } from "@/components/forms/FormControls"
import { buttonClassName, ButtonLink } from "@/components/ui/ButtonLink"
import { site } from "@/config/site"
import { formNames } from "@/lib/forms/messages"
import { contactTopics, isContactTopic } from "@/lib/forms/topics"

type Office = {
  city: string
  country: string
  address: string
  phone?: string
  email: string
}

type ContactSectionProps = {
  nameLabel: string
  emailLabel: string
  companyLabel: string
  topicLabel: string
  messageLabel: string
  consent: string
  consentLinkText: string
  consentHref: string
  submit: string
  asideTitle: string
  schedule: string
  scheduleHref: string
  offices: Office[]
}

const fieldClass =
  "block w-full border-0 border-b border-ink bg-transparent pt-2 text-xl leading-[1.5] text-ink placeholder:text-neutral-3 focus:border-brand-5 focus:outline-none"

const phoneHref = `tel:${site.phone.replace(/[^\d+]/g, "")}`

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`
}

function subscribeToTopic(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function topicFromLocation() {
  const requested = new URLSearchParams(window.location.search).get("topic")
  return requested && isContactTopic(requested) ? requested : ""
}

function topicFromServer() {
  return ""
}

export function ContactSection({
  nameLabel,
  emailLabel,
  companyLabel,
  topicLabel,
  messageLabel,
  consent,
  consentLinkText,
  consentHref,
  submit,
  asideTitle,
  schedule,
  scheduleHref,
  offices,
}: ContactSectionProps) {
  const { fieldErrors, sending, submit: send, banner } = useFormSubmit(formNames.contact)
  const topicFromUrl = useSyncExternalStore(subscribeToTopic, topicFromLocation, topicFromServer)
  const [chosen, setChosen] = useState<string | null>(null)
  const topic = chosen ?? topicFromUrl

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    await send("/api/forms/contact-us", {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      company: String(data.get("company") ?? ""),
      topic: String(data.get("topic") ?? ""),
      message: String(data.get("message") ?? ""),
      consent: data.get("consent") === "on",
      hp_field: String(data.get("hp_field") ?? ""),
    })
  }

  const messageDescribedBy = [
    "contact-message-hint",
    fieldErrors.message ? "contact-message-error" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <section className="bg-paper py-[var(--size-7rem)] text-ink">
      <div className="site-container">
        <div className="grid items-start gap-16 desk:grid-cols-2">
          <form className="relative flex min-w-0 flex-col gap-8" aria-label="Contact us" onSubmit={onSubmit} noValidate>
            <Honeypot />
            <label className="block">
              <span className="font-medium">{nameLabel}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                maxLength={256}
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                className={fieldClass}
              />
              <FieldError id="contact-name-error" message={fieldErrors.name} />
            </label>
            <label className="block">
              <span className="font-medium">{emailLabel}</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                className={fieldClass}
              />
              <FieldError id="contact-email-error" message={fieldErrors.email} />
            </label>
            <label className="block">
              <span className="font-medium">
                {companyLabel} <span className="font-normal text-neutral-3">(optional)</span>
              </span>
              <input
                type="text"
                name="company"
                autoComplete="organization"
                maxLength={256}
                aria-invalid={fieldErrors.company ? true : undefined}
                aria-describedby={fieldErrors.company ? "contact-company-error" : undefined}
                className={fieldClass}
              />
              <FieldError id="contact-company-error" message={fieldErrors.company} />
            </label>
            <label className="block">
              <span className="font-medium">{topicLabel}</span>
              <span className="relative block">
                <select
                  name="topic"
                  required
                  value={topic}
                  onChange={(event) => setChosen(event.target.value)}
                  aria-invalid={fieldErrors.topic ? true : undefined}
                  aria-describedby={fieldErrors.topic ? "contact-topic-error" : undefined}
                  className={`${fieldClass} appearance-none pr-8 ${topic ? "" : "text-neutral-3"} [&_option]:text-ink`}
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  {contactTopics.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute top-1/2 right-0 size-5 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <FieldError id="contact-topic-error" message={fieldErrors.topic} />
            </label>
            <label className="block">
              <span className="font-medium">{messageLabel}</span>
              <textarea
                name="message"
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                aria-invalid={fieldErrors.message ? true : undefined}
                aria-describedby={messageDescribedBy}
                className={`${fieldClass} min-h-32 resize-y`}
              />
              <p id="contact-message-hint" className="mt-1 text-sm text-neutral-3">
                20–2000 characters
              </p>
              <FieldError id="contact-message-error" message={fieldErrors.message} />
            </label>
            <div>
              <div className="flex items-start gap-3 text-base leading-6">
                <span className="relative mt-0.5 flex size-6 shrink-0">
                  <input
                    id="contact-consent"
                    type="checkbox"
                    name="consent"
                    required
                    aria-invalid={fieldErrors.consent ? true : undefined}
                    aria-describedby={fieldErrors.consent ? "contact-consent-error" : undefined}
                    className="peer size-6 appearance-none rounded-lg border-[0.094rem] border-[#201e28e6] bg-transparent checked:border-brand checked:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="pointer-events-none absolute inset-[20%] hidden text-paper peer-checked:block"
                  >
                    <path
                      d="m4 12.5 5 5L20 6.5"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <label htmlFor="contact-consent">
                  {consent}{" "}
                  <Link
                    href={consentHref}
                    className="font-semibold whitespace-nowrap underline underline-offset-2"
                  >
                    {consentLinkText}
                  </Link>{"."}
                </label>
              </div>
              <FieldError id="contact-consent-error" message={fieldErrors.consent} />
            </div>
            <div>
              <button
                type="submit"
                disabled={sending}
                aria-busy={sending}
                className={buttonClassName({ tone: "onLight", className: "gap-2 disabled:opacity-70" })}
              >
                {sending ? <Spinner /> : null}
                {submit}
              </button>
              <FormBanner kind={banner} className="mt-4 text-base" />
            </div>
          </form>
          <aside className="min-w-0 rounded-2xl bg-neutral-1 px-8 py-10 desk:px-12 desk:py-12">
            <h2 className="trim-text text-[length:var(--size-2rem)] leading-[1.1] font-black tracking-[-0.03em]">
              {asideTitle}
            </h2>
            <div className="mt-8">
              <ButtonLink href={scheduleHref} tone="onLight">
                {schedule}
              </ButtonLink>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[1.25rem] leading-[1.5]">
              <Image src="/images/home/icon-phone.svg" alt="" width={32} height={32} unoptimized className="size-8" />
              <a href={phoneHref}>{site.phone}</a>
            </p>
            <ul className="mt-10 flex list-none flex-col gap-6">
              {offices.map((office) => (
                <li key={office.city} className="border-t border-ink/15 pt-6 first:border-t-0 first:pt-0">
                  <h3 className="trim-text mb-3 text-xl leading-[1.1] font-medium">
                    <strong className="font-extrabold">{office.city},</strong> {office.country}
                  </h3>
                  <p className="text-base leading-6 break-words">
                    <strong className="font-bold">{office.address}</strong>
                    <br />
                    {office.phone ? (
                      <>
                        <a href={telHref(office.phone)}>{office.phone}</a>
                        <br />
                      </>
                    ) : null}
                    <a href={`mailto:${office.email}`}>{office.email}</a>
                  </p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
