function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

/** Active duplicates are a success. Code 201 is "Already subscribed". */
export function subscriberAccepted(status: number, payload: unknown) {
  if (status >= 200 && status < 300) return true
  if (status !== 400 || !payload || typeof payload !== "object") return false
  return (payload as { Code?: unknown }).Code === 201
}

export async function addSubscriber(email: string) {
  const apiKey = requiredEnv("CAMPAIGN_MONITOR_API_KEY")
  const listId = requiredEnv("CAMPAIGN_MONITOR_LIST_ID")
  const response = await fetch(
    `https://api.createsend.com/api/v3.3/subscribers/${encodeURIComponent(listId)}.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${apiKey}:x`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        EmailAddress: email,
        Name: "",
        Resubscribe: true,
        RestartSubscriptionBasedAutoresponders: false,
        ConsentToTrack: "Yes",
      }),
    },
  )

  const text = await response.text()
  let payload: unknown = text
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!subscriberAccepted(response.status, payload)) {
    const code =
      payload && typeof payload === "object" && "Code" in payload
        ? String((payload as { Code?: unknown }).Code)
        : String(response.status)
    throw new Error(`Campaign Monitor rejected the subscriber (${code})`)
  }
}
