/** Ignore submits faster than this. The value is set when the form mounts. */
export const MIN_SUBMIT_MS = 3_000
/** Drop stale timestamps so a saved page cannot be replayed days later. */
export const MAX_SUBMIT_MS = 24 * 60 * 60 * 1000
export const RATE_LIMIT = 5
export const RATE_WINDOW_MS = 10 * 60 * 1000

// Stored in memory on this server instance. A serverless instance does not
// share the map with other instances, and the counts disappear when the
// instance is recycled, so the limit is best-effort.
const hits = new Map<string, number[]>()

export function resetRateLimit() {
  hits.clear()
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get("x-real-ip")?.trim()
  return realIp || "unknown"
}

export function allowIp(ip: string, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent)
    return false
  }

  recent.push(now)
  hits.set(ip, recent)
  return true
}

export function honeypotFilled(body: unknown) {
  if (!body || typeof body !== "object") return false
  const value = (body as { hp_field?: unknown }).hp_field
  if (value == null) return false
  if (typeof value === "string") return value.trim() !== ""
  return true
}

export function timingOk(body: unknown, now = Date.now()) {
  if (!body || typeof body !== "object") return false
  const startedAt = (body as { startedAt?: unknown }).startedAt
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) return false
  const elapsed = now - startedAt
  return elapsed >= MIN_SUBMIT_MS && elapsed <= MAX_SUBMIT_MS
}
