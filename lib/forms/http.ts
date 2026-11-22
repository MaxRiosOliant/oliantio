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
export async function admit(request: Request, now = Date.now()): Promise<Admission> {
  if (!allowIp(clientIp(request), now)) {
    return { type: "done", response: jsonError(429) }
  }

  const body = await readJson(request)
  if (honeypotFilled(body)) {
    return { type: "done", response: jsonOk() }
  }

  if (!timingOk(body, now)) {
    return { type: "done", response: jsonError(400) }
  }

  if (body === undefined) {
    return { type: "done", response: jsonError(400) }
  }

  return { type: "proceed", body }
}
