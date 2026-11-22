import { formBody, formSubject, sendFormEmail, type FormEmail } from "./email.ts"
import { handleEmailForm } from "./email-form.ts"
import { contactSchema, type ContactInput } from "./schema.ts"
import { contactTopicLabel } from "./topics.ts"

export function contactFields(data: ContactInput) {
  return [
    { label: "Name", value: data.name },
    { label: "Work email", value: data.email },
    { label: "Company", value: data.company },
    { label: "What can we help with?", value: contactTopicLabel(data.topic) },
    { label: "Message", value: data.message },
    { label: "Consent", value: "Yes" },
  ]
}

export function buildContactEmail(data: ContactInput, submittedAt: Date): FormEmail {
  return {
    replyTo: data.email,
    subject: formSubject(`Contact: ${contactTopicLabel(data.topic)}`, data.name),
    text: formBody(contactFields(data), data.pageUrl, submittedAt),
  }
}

export function handleContact(
  request: Request,
  now = Date.now(),
  send: (message: FormEmail) => Promise<void> = sendFormEmail,
) {
  return handleEmailForm(request, now, contactSchema, buildContactEmail, send)
}

export function POST(request: Request) {
  return handleContact(request)
}
