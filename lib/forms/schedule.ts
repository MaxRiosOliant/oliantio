import { formBody, formSubject, sendFormEmail, type FormEmail } from "./email.ts"
import { handleEmailForm } from "./email-form.ts"
import { formNames } from "./messages.ts"
import { scheduleSchema, type ScheduleInput } from "./schema.ts"

export function scheduleFields(data: ScheduleInput) {
  return [
    { label: "Name", value: data.name },
    { label: "Email Address", value: data.email },
    { label: "How can I help you?", value: data.message },
    { label: "What service are you interested in?", value: data.topic },
  ]
}

export function buildScheduleEmail(data: ScheduleInput, submittedAt: Date): FormEmail {
  return {
    replyTo: data.email,
    subject: formSubject(formNames.schedule, data.name || data.email),
    text: formBody(scheduleFields(data), data.pageUrl, submittedAt),
  }
}

export function handleSchedule(
  request: Request,
  now = Date.now(),
  send: (message: FormEmail) => Promise<void> = sendFormEmail,
) {
  return handleEmailForm(request, now, scheduleSchema, buildScheduleEmail, send)
}

export function POST(request: Request) {
  return handleSchedule(request)
}
