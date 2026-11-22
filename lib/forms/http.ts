import { FORM_ERROR } from "./messages.ts"
import { allowIp, clientIp, honeypotFilled, timingOk } from "./spam.ts"

export function jsonOk() {
  return Response.json({ ok: true as const })
}

export function jsonError(status: number, fieldErrors: Record<string, string> = {}) {
  return Response.json({ ok: false as const, message: FORM_ERROR, fieldErrors }, { status })
}

export async function readJson(request: Request) {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

export type Admission =
  | { type: "proceed"; body: unknown }
  | { type: "done"; response: Response }

/** Rate limit, honeypot, and minimum time. Honeypot hits look like success. */
function blocked(request: Request, reason: string, response: Response): Admission {
  console.log(`form blocked ${reason} ${new URL(request.url).pathname}`)
  return { type: "done", response }
}

export async function admit(request: Request, now = Date.now()): Promise<Admission> {
  if (!allowIp(clientIp(request), now)) {
    return blocked(request, "rate-limit", jsonError(429))
  }

  const body = await readJson(request)
  if (honeypotFilled(body)) {
    return blocked(request, "honeypot", jsonOk())
  }

  if (!timingOk(body, now)) {
    return blocked(request, "timing", jsonError(400))
  }

  if (body === undefined) {
    return blocked(request, "invalid-json", jsonError(400))
  }

  return { type: "proceed", body }
}
