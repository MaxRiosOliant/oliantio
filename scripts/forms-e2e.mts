// Submits each form to a running server and checks Resend + Campaign Monitor.
// Requires .env.local and `npm start` (or the dev server) on BASE_URL.
//
// node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/forms-e2e.mts

import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadEnv(file: string) {
  const text = readFileSync(path.join(root, file), "utf8")
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnv(".env.local")

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3210"
const required = [
  "RESEND_API_KEY",
  "FORM_FROM_EMAIL",
  "FORM_TO_EMAIL",
  "CAMPAIGN_MONITOR_API_KEY",
  "CAMPAIGN_MONITOR_LIST_ID",
]
const missing = required.filter((name) => !process.env[name]?.trim())
if (missing.length > 0) {
  console.error(`Missing ${missing.join(", ")} in .env.local`)
  process.exit(1)
}

const toEmail = process.env.FORM_TO_EMAIL!.trim()
const [localPart, domain] = toEmail.split("@")
if (!localPart || !domain) {
  console.error("FORM_TO_EMAIL is not an email address")
  process.exit(1)
}
const testEmail = `${localPart.split("+")[0]}+formtest@${domain}`
const token = `e2e-${Date.now()}`
const startedAt = Date.now() - 10_000

function cmAuth() {
  return `Basic ${Buffer.from(`${process.env.CAMPAIGN_MONITOR_API_KEY}:x`).toString("base64")}`
}

function listUrl(email?: string) {
  const id = encodeURIComponent(process.env.CAMPAIGN_MONITOR_LIST_ID!.trim())
  const query = email ? `?email=${encodeURIComponent(email)}` : ""
  return `https://api.createsend.com/api/v3.3/subscribers/${id}.json${query}`
}

async function submit(pathname: string, body: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.50" },
    body: JSON.stringify({ hp_field: "", startedAt, pageUrl: `${baseUrl}${pathname}`, ...body }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status} ${JSON.stringify(payload)}`)
  }
  return payload
}

async function resendEmails() {
  const response = await fetch("https://api.resend.com/emails", {
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  })
  if (!response.ok) {
    throw new Error(`Resend list failed (${response.status})`)
  }
  const payload = (await response.json()) as { data?: { id: string; subject: string; to: string[]; last_event?: string }[] }
  return payload.data ?? []
}

async function emailDetails(id: string) {
  const response = await fetch(`https://api.resend.com/emails/${id}`, {
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  })
  if (!response.ok) throw new Error(`Resend get failed (${response.status})`)
  return (await response.json()) as {
    id: string
    subject: string
    to: string[]
    reply_to: string[] | null
    text: string | null
    last_event: string
  }
}

async function waitForEmail(subject: string) {
  const deadline = Date.now() + 60_000
  let id = ""
  while (Date.now() < deadline) {
    if (!id) {
      const emails = await resendEmails()
      id = emails.find((email) => email.subject === subject)?.id ?? ""
    }
    if (id) {
      const email = await emailDetails(id)
      const arrived = email.last_event === "delivered" || email.last_event === "sent" || email.last_event === "opened"
      if (arrived) return email
      if (email.last_event === "bounced" || email.last_event === "failed" || email.last_event === "suppressed") {
        throw new Error(`${subject} was ${email.last_event}`)
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error(`Resend did not deliver ${subject}`)
}

async function subscriber(email: string) {
  const response = await fetch(listUrl(email), { headers: { authorization: cmAuth() } })
  const text = await response.text()
  let payload: unknown = text
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text
  }
  return { status: response.status, payload }
}

async function waitForSubscriber(email: string) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    const found = await subscriber(email)
    if (found.status === 200) return found.payload
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  throw new Error(`Campaign Monitor did not list ${email}`)
}

const scheduleSubject = `[oliant.io] Schedule a Call — E2E ${token}`

console.log(`Submitting forms to ${baseUrl} as ${testEmail}`)

await submit("/api/forms/schedule-a-call", {
  name: `E2E ${token}`,
  email: testEmail,
  message: `Schedule check ${token}`,
  topic: "Other",
})
await submit("/api/forms/newsletter", { email: testEmail, terms: true })
const again = await submit("/api/forms/newsletter", { email: testEmail, terms: true })
if (!again || (again as { ok?: boolean }).ok !== true) {
  throw new Error("A second subscribe of the same address was not a success")
}

const scheduleEmail = await waitForEmail(scheduleSubject)
if (!scheduleEmail.to.some((address) => address.toLowerCase() === toEmail.toLowerCase())) {
  throw new Error(`${scheduleEmail.subject} was not addressed to the form inbox`)
}
if (!scheduleEmail.reply_to?.some((address) => address.toLowerCase() === testEmail.toLowerCase())) {
  throw new Error(`${scheduleEmail.subject} reply-to was not the submitter`)
}
if (!scheduleEmail.text?.includes(token) || !scheduleEmail.text.includes("Page:")) {
  throw new Error(`${scheduleEmail.subject} body is missing the submission`)
}
console.log(`Delivered ${scheduleEmail.subject} (${scheduleEmail.last_event})`)

const details = await waitForSubscriber(testEmail)
const state =
  details && typeof details === "object" && "State" in details ? String((details as { State?: unknown }).State) : "unknown"
console.log(`Campaign Monitor subscriber state: ${state}`)

const deleted = await fetch(listUrl(testEmail), { method: "DELETE", headers: { authorization: cmAuth() } })
if (!deleted.ok) {
  throw new Error(`Could not remove ${testEmail} (${deleted.status}). Remove it in Campaign Monitor.`)
}
console.log(`Removed ${testEmail} from the list`)
