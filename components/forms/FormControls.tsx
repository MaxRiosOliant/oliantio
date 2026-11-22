"use client"

import { useEffect, useRef, useState } from "react"

import { trackEvent } from "@/lib/analytics"
import { FORM_ERROR, FORM_SUCCESS } from "@/lib/forms/messages"

type Status = "idle" | "sending" | "success" | "error"

export function useFormSubmit(formName: string) {
  const startedAt = useRef(0)
  const [status, setStatus] = useState<Status>("idle")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  async function submit(endpoint: string, fields: Record<string, string | boolean>) {
    setStatus("sending")
    setFieldErrors({})

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...fields,
          startedAt: startedAt.current,
          pageUrl: window.location.href,
        }),
      })
      const data = (await response.json().catch(() => null)) as {
        fieldErrors?: Record<string, string>
      } | null
      if (!response.ok) {
        setFieldErrors(data?.fieldErrors ?? {})
        setStatus("error")
        return
      }
      setStatus("success")
      trackEvent("generate_lead", { form_name: formName })
    } catch {
      setFieldErrors({})
      setStatus("error")
    }
  }

  const banner: "success" | "error" | null =
    status === "success" ? "success" : status === "error" && Object.keys(fieldErrors).length === 0 ? "error" : null

  return { fieldErrors, sending: status === "sending", submit, banner }
}

export function Honeypot() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
      <label>
        Company website
        <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  )
}

export function FieldError({ id, message, tone = "light" }: { id: string; message?: string; tone?: "light" | "dark" }) {
  if (!message) return null
  const color = tone === "dark" ? "text-[#ffb4b4]" : "text-[#9f1239]"
  return (
    <p id={id} className={`mt-1 text-sm ${color}`}>
      {message}
    </p>
  )
}

export function Spinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 animate-spin" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function FormBanner({ kind, className = "text-base" }: { kind: "success" | "error" | null; className?: string }) {
  if (kind === "success") {
    return (
      <p role="status" className={className}>
        {FORM_SUCCESS}
      </p>
    )
  }
  if (kind === "error") {
    return (
      <p role="alert" className={className}>
        {FORM_ERROR}
      </p>
    )
  }
  return null
}
