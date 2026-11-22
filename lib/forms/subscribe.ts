import { admit, jsonError, jsonOk } from "./http.ts"
import { addSubscriber } from "./newsletter.ts"
import { fieldErrorsFrom, newsletterSchema } from "./schema.ts"

export function handleNewsletter(
  request: Request,
  now = Date.now(),
  subscribe: (email: string) => Promise<void> = addSubscriber,
) {
  return submitNewsletter(request, now, subscribe)
}

async function submitNewsletter(
  request: Request,
  now: number,
  subscribe: (email: string) => Promise<void>,
) {
  const admission = await admit(request, now)
  if (admission.type === "done") return admission.response

  const parsed = newsletterSchema.safeParse(admission.body)
  if (!parsed.success) return jsonError(400, fieldErrorsFrom(parsed.error))

  try {
    await subscribe(parsed.data.email)
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Newsletter subscribe failed")
    return jsonError(500)
  }

  return jsonOk()
}

export function POST(request: Request) {
  return handleNewsletter(request)
}
