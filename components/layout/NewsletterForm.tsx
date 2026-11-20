"use client"

import { useState } from "react"

import { home } from "@/content/home"
import { buttonClassName } from "@/components/ui/ButtonLink"

export function NewsletterForm() {
  const footer = home.footer
  const [submitted, setSubmitted] = useState(false)

  return (
    <form
      className="mt-8 flex flex-col items-start gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
      }}
    >
      <label htmlFor="email" className="text-xl leading-normal">
        {footer.emailLabel}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="h-[2.625rem] w-full rounded-2xl border border-neutral-2 bg-neutral-2 px-4 text-base text-ink"
      />
      <label className="flex items-center gap-3 text-base">
        <input type="checkbox" name="terms" required className="size-4 accent-brand-5" />
        {footer.terms}
      </label>
      <button type="submit" className={buttonClassName({ variant: "secondary", tone: "onLight" })}>
        {footer.subscribe}
      </button>
      {submitted ? (
        <p role="status" className="text-base">
          Thank you! Your submission has been received!
        </p>
      ) : null}
    </form>
  )
}
