import type { ZodType } from "zod"

import type { FormEmail } from "./email.ts"
import { admit, jsonError, jsonOk } from "./http.ts"
import { fieldErrorsFrom } from "./schema.ts"

type Send = (message: FormEmail) => Promise<void>

export async function handleEmailForm<T extends { email: string }>(
  request: Request,
  now: number,
  schema: ZodType<T>,
  build: (data: T, submittedAt: Date) => FormEmail,
  send: Send,
) {
  const admission = await admit(request, now)
  if (admission.type === "done") return admission.response

  const parsed = schema.safeParse(admission.body)
  if (!parsed.success) return jsonError(400, fieldErrorsFrom(parsed.error))

  try {
    await send(build(parsed.data, new Date(now)))
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Form email failed")
    return jsonError(500)
  }

  return jsonOk()
}
