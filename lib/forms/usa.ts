import { formBody, formSubject, sendFormEmail, type FormEmail } from "./email.ts"
import { handleEmailForm } from "./email-form.ts"
import { formNames } from "./messages.ts"
import { usaSchema, type UsaInput } from "./schema.ts"

export function usaFields(data: UsaInput) {
  return [
    { label: "Number of Employees", value: data.employees },
    { label: "First Name", value: data.firstName },
    { label: "Last Name", value: data.lastName },
    { label: "Email Address", value: data.email },
    { label: "Job Title", value: data.jobTitle },
    { label: "Company Name", value: data.company },
    { label: "Phone Number", value: data.phone },
    {
      label: "I agree to receive marketing emails and newsletters.",
      value: data.subscribe ? "Yes" : "No",
    },
  ]
}

export function buildUsaEmail(data: UsaInput, submittedAt: Date): FormEmail {
  const name = `${data.firstName} ${data.lastName}`.trim()
  return {
    replyTo: data.email,
    subject: formSubject(formNames.usa, name || data.email),
    text: formBody(usaFields(data), data.pageUrl, submittedAt),
  }
}

export function handleUsa(
  request: Request,
  now = Date.now(),
  send: (message: FormEmail) => Promise<void> = sendFormEmail,
) {
  return handleEmailForm(request, now, usaSchema, buildUsaEmail, send)
}

export function POST(request: Request) {
  return handleUsa(request)
}
