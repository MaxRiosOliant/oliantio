import { Resend } from "resend"

export type FormEmail = {
  replyTo: string
  subject: string
  text: string
}

export type LabeledField = {
  label: string
  value: string
}

export function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
}

export function safePageUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return ""
    return url.toString()
  } catch {
    return ""
  }
}

export function formSubject(formName: string, identity: string) {
  return `[oliant.io] ${formName} — ${oneLine(identity)}`
}

export function formBody(fields: LabeledField[], pageUrl: string, submittedAt: Date) {
  const lines = fields.map((field) => `${field.label}: ${field.value}`)
  lines.push("", `Page: ${safePageUrl(pageUrl)}`, `Submitted: ${submittedAt.toISOString()}`)
  return lines.join("\n")
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

export async function sendFormEmail(message: FormEmail) {
  const apiKey = requiredEnv("RESEND_API_KEY")
  const from = requiredEnv("FORM_FROM_EMAIL")
  const to = requiredEnv("FORM_TO_EMAIL")
  if (!/no-reply@/i.test(from)) {
    throw new Error("FORM_FROM_EMAIL must be a no-reply@ address")
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
  })
  if (error) {
    throw new Error(error.message)
  }
}
