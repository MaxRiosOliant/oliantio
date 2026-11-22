"use client"

import type { FormEvent } from "react"

import { FieldError, FormBanner, Honeypot, Spinner, useFormSubmit } from "@/components/forms/FormControls"
import { home } from "@/content/home"
import { buttonClassName } from "@/components/ui/ButtonLink"
import { formNames } from "@/lib/forms/messages"

export function NewsletterForm() {
  const footer = home.footer
  const { fieldErrors, sending, submit, banner } = useFormSubmit(formNames.newsletter)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const terms = form.querySelector<HTMLInputElement>("input[name='terms']")
    await submit("/api/forms/newsletter", {
      email: String(data.get("email") ?? ""),
      terms: Boolean(terms?.checked),
      hp_field: String(data.get("hp_field") ?? ""),
    })
  }

  return (
    <form className="relative mb-[15px] flex flex-col items-start gap-4 py-[var(--size-2rem)]" onSubmit={onSubmit} noValidate>
      <Honeypot />
      <label htmlFor="email" className="trim-text text-xl leading-normal">
        {footer.emailLabel}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        aria-invalid={fieldErrors.email ? true : undefined}
        aria-describedby={fieldErrors.email ? "newsletter-email-error" : undefined}
        className="mb-2.5 h-[2.625rem] w-full rounded-2xl border border-neutral-2 bg-neutral-2 px-4 text-base text-ink"
      />
      <FieldError id="newsletter-email-error" message={fieldErrors.email} />
      <label className="flex w-full items-center gap-2 text-base leading-6">
        <span className="relative flex size-6 shrink-0">
          <input
            type="checkbox"
            name="terms"
            required
            aria-invalid={fieldErrors.terms ? true : undefined}
            aria-describedby={fieldErrors.terms ? "newsletter-terms-error" : undefined}
            className="peer size-6 appearance-none rounded-lg border-[0.094rem] border-[#201e28e6] bg-transparent checked:border-brand checked:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute inset-[20%] hidden text-paper peer-checked:block"
          >
            <path d="m4 12.5 5 5L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {footer.terms}
      </label>
      <FieldError id="newsletter-terms-error" message={fieldErrors.terms} />
      <button
        type="submit"
        disabled={sending}
        aria-busy={sending}
        className={buttonClassName({
          variant: "secondary",
          tone: "onLight",
          className: "mt-6 gap-2 disabled:opacity-70",
        })}
      >
        {sending ? <Spinner /> : null}
        {footer.subscribe}
      </button>
      <FormBanner kind={banner} />
    </form>
  )
}
