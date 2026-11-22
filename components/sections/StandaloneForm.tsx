"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"

import { FieldError, FormBanner, Honeypot, Spinner, useFormSubmit } from "@/components/forms/FormControls"
import { formNames } from "@/lib/forms/messages"

type Field = {
  name: string
  label: string
  placeholder: string
  type?: "text" | "email" | "tel"
  required?: boolean
}

type StandaloneFormProps = {
  logo: { src: string; alt: string; width: number; height: number }
  background: { src: string; alt: string }
  title: string
  text: string
  selectLabel: string
  selectOptions: string[]
  consent: string
  consentLinkText: string
  consentHref: string
  next: string
  detailsTitle: string
  fields: Field[]
  optIn: string
  submit: string
}

const surface =
  "rounded-[15px] border border-white/25 bg-[radial-gradient(circle,rgba(255,255,255,0.12),rgba(255,255,255,0.17))] shadow-[0_0_20px_rgba(0,0,0,0.55)]"

export function StandaloneForm({
  logo,
  background,
  title,
  text,
  selectLabel,
  selectOptions,
  consent,
  consentLinkText,
  consentHref,
  next,
  detailsTitle,
  fields,
  optIn,
  submit,
}: StandaloneFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [employeesError, setEmployeesError] = useState("")
  const { fieldErrors, sending, submit: send, banner } = useFormSubmit(formNames.usa)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (step !== 2) {
      const employees = String(data.get("employees") ?? "")
      if (!employees) {
        setEmployeesError("This field is required.")
        return
      }
      setEmployeesError("")
      setStep(2)
      return
    }
    await send("/api/forms/oliant-form-usa", {
      employees: String(data.get("employees") ?? ""),
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      email: String(data.get("email") ?? ""),
      jobTitle: String(data.get("jobTitle") ?? ""),
      company: String(data.get("company") ?? ""),
      phone: String(data.get("phone") ?? ""),
      subscribe: data.get("subscribe") === "on",
      hp_field: String(data.get("hp_field") ?? ""),
    })
  }

  return (
    <section className="relative isolate flex min-h-screen overflow-hidden bg-[#1a181e] text-paper">
      <div className="absolute top-[-30%] left-[-30%] -z-10 h-[130%] w-full opacity-50">
        <Image src={background.src} alt={background.alt} fill priority sizes="100vw" className="object-cover" />
      </div>
      <div className="hidden w-[30%] shrink-0 border-r border-white/20 px-[50px] pt-[50px] md:block">
        <Link href="/" aria-label="Home Page" className="inline-block">
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className="[filter:brightness(1e7)]"
          />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_100%_100%,rgba(255,255,255,0),rgba(255,255,255,0.12))] px-6 py-16">
        <form className="relative w-full max-w-[47rem]" onSubmit={onSubmit} noValidate>
          <Honeypot />
          <div className="mb-8 md:hidden">
            <Link href="/" aria-label="Home Page" className="inline-block">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="[filter:brightness(1e7)]"
              />
            </Link>
          </div>
          <h1 className="text-[38px] leading-[44px] font-semibold">
            {step === 1 ? title : detailsTitle}
          </h1>
          <p className="mt-2 text-base leading-6 opacity-80">{text}</p>
          <div hidden={step !== 1}>
              <label className="relative mt-6 block">
                <span className="sr-only">{selectLabel}</span>
                <select
                  name="employees"
                  required
                  defaultValue=""
                  aria-invalid={employeesError || fieldErrors.employees ? true : undefined}
                  aria-describedby={employeesError || fieldErrors.employees ? "usa-employees-error" : undefined}
                  className={`${surface} block w-full appearance-none px-5 py-5 text-base text-paper [&_option]:text-ink`}
                >
                  <option value="">{selectLabel}</option>
                  {selectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute top-1/2 right-5 size-4 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </label>
              <p className="mt-2 text-sm leading-[22px] opacity-70">
                {consent}{" "}
                <Link href={consentHref} className="font-bold opacity-100">
                  {consentLinkText}
                </Link>
              </p>
              <FieldError
                id="usa-employees-error"
                tone="dark"
                message={employeesError || fieldErrors.employees}
              />
              <button
                type="button"
                onClick={(event) => {
                  const employees = String(new FormData(event.currentTarget.form ?? undefined).get("employees") ?? "")
                  if (!employees) {
                    setEmployeesError("This field is required.")
                    return
                  }
                  setEmployeesError("")
                  setStep(2)
                }}
                className="mt-4 w-full rounded-[15px] bg-[#19d99f] py-[23px] text-lg leading-[27px] font-semibold text-paper"
              >
                {next}
              </button>
          </div>
          <div hidden={step !== 2}>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <label key={field.name} className="block sm:[&:nth-child(n+3)]:col-span-2">
                    <span className="mb-1 block text-sm font-medium">{field.label}</span>
                    <input
                      type={field.type ?? "text"}
                      name={field.name}
                      required={field.required}
                      maxLength={256}
                      placeholder={field.placeholder}
                      aria-invalid={fieldErrors[field.name] ? true : undefined}
                      aria-describedby={fieldErrors[field.name] ? `usa-${field.name}-error` : undefined}
                      className={`${surface} block w-full px-5 py-3 text-base text-paper placeholder:text-paper/60`}
                    />
                    <FieldError id={`usa-${field.name}-error`} tone="dark" message={fieldErrors[field.name]} />
                  </label>
                ))}
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm">
                <input type="checkbox" name="subscribe" defaultChecked className="size-4 accent-[#19d99f]" />
                {optIn}
              </label>
              <button
                type="submit"
                disabled={sending}
                aria-busy={sending}
                className="relative mt-6 w-full rounded-[15px] bg-[#19d99f] py-[23px] text-lg leading-[27px] font-semibold text-paper disabled:opacity-70"
              >
                {sending ? (
                  <span className="absolute top-1/2 left-6 -translate-y-1/2">
                    <Spinner />
                  </span>
                ) : null}
                {submit}
              </button>
              <FormBanner kind={banner} className="mt-4 text-base" />
          </div>
        </form>
      </div>
    </section>
  )
}
