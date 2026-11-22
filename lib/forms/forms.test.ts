import assert from "node:assert/strict"
import { beforeEach, describe, it } from "node:test"

import { formSubject, safePageUrl, type FormEmail } from "./email.ts"
import { FORM_ERROR, formNames } from "./messages.ts"
import { subscriberAccepted } from "./newsletter.ts"
import { handleSchedule } from "./schedule.ts"
import { RATE_LIMIT, resetRateLimit } from "./spam.ts"
import { handleNewsletter } from "./subscribe.ts"
import { handleUsa } from "./usa.ts"

const now = Date.parse("2026-11-21T18:00:00.000Z")

function post(url: string, body: unknown, ip = "203.0.113.10") {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

function ready(extra: Record<string, unknown> = {}) {
  return {
    hp_field: "",
    startedAt: now - 10_000,
    pageUrl: "https://www.oliant.io/schedule-a-call",
    ...extra,
  }
}

beforeEach(() => {
  resetRateLimit()
})

describe("schedule a call", () => {
  it("returns field errors and does not send when the email is invalid", async () => {
    const sent: FormEmail[] = []
    const response = await handleSchedule(
      post("http://local/api/forms/schedule-a-call", ready({ name: "Jane", email: "not-an-email", message: "Hello" })),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.equal(body.ok, false)
    assert.equal(body.message, FORM_ERROR)
    assert.match(body.fieldErrors.email, /email/i)
    assert.equal(sent.length, 0)
  })

  it("requires a message", async () => {
    const response = await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({ name: "Jane", email: "jane@example.com", message: "  " }),
      ),
      now,
      async () => {},
    )
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.match(body.fieldErrors.message, /required/i)
  })

  it("rejects a topic outside the list", async () => {
    const response = await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({ name: "Jane", email: "jane@example.com", message: "Hello", topic: "Spam" }),
      ),
      now,
      async () => {},
    )
    const body = await response.json()
    assert.equal(body.fieldErrors.topic.length > 0, true)
  })

  it("sends every labeled field, the page, and the timestamp", async () => {
    const sent: FormEmail[] = []
    const response = await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({
          name: "Jane Doe",
          email: "jane@example.com",
          message: "We need a team.",
          topic: "QA & Testing",
          pageUrl: "https://www.oliant.io/schedule-a-call?ref=home",
        }),
      ),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    assert.equal(response.status, 200)
    assert.equal(sent.length, 1)
    const email = sent[0]
    assert.equal(email.replyTo, "jane@example.com")
    assert.equal(email.subject, `[oliant.io] ${formNames.schedule} — Jane Doe`)
    assert.match(email.text, /Name: Jane Doe/)
    assert.match(email.text, /Email Address: jane@example.com/)
    assert.match(email.text, /How can I help you\?: We need a team\./)
    assert.match(email.text, /What service are you interested in\?: QA & Testing/)
    assert.match(email.text, /Page: https:\/\/www\.oliant\.io\/schedule-a-call\?ref=home/)
    assert.match(email.text, /Submitted: 2026-11-21T18:00:00.000Z/)
    assert.doesNotMatch(email.text, /hp_field/)
  })

  it("uses the email in the subject when the name is blank", async () => {
    const sent: FormEmail[] = []
    await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({ name: "  ", email: "jane@example.com", message: "Hello" }),
      ),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    assert.equal(sent[0].subject, `[oliant.io] ${formNames.schedule} — jane@example.com`)
  })

  it("keeps newlines out of the subject", async () => {
    const sent: FormEmail[] = []
    await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({ name: "Jane\r\nBcc: x", email: "jane@example.com", message: "Hello" }),
      ),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    assert.equal(sent[0].subject.includes("\n"), false)
    assert.equal(sent[0].subject.includes("\r"), false)
  })
})

describe("oliant form usa", () => {
  it("returns a field error for each missing detail", async () => {
    const sent: FormEmail[] = []
    const response = await handleUsa(
      post("http://local/api/forms/oliant-form-usa", ready({ employees: "1 - 10", email: "a@b.co" })),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.match(body.fieldErrors.firstName, /required/i)
    assert.match(body.fieldErrors.lastName, /required/i)
    assert.match(body.fieldErrors.company, /required/i)
    assert.equal(sent.length, 0)
  })

  it("emails the full name and every field", async () => {
    const sent: FormEmail[] = []
    const response = await handleUsa(
      post(
        "http://local/api/forms/oliant-form-usa",
        ready({
          employees: "11 - 50",
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          jobTitle: "Founder",
          company: "Analytical Engines",
          phone: "",
          subscribe: true,
          pageUrl: "https://www.oliant.io/oliant-form-usa",
        }),
      ),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    assert.equal(response.status, 200)
    assert.equal(sent[0].replyTo, "ada@example.com")
    assert.equal(sent[0].subject, `[oliant.io] ${formNames.usa} — Ada Lovelace`)
    assert.match(sent[0].text, /Number of Employees: 11 - 50/)
    assert.match(sent[0].text, /Phone Number: \n/)
    assert.match(sent[0].text, /marketing emails and newsletters\.: Yes/)
    assert.match(sent[0].text, /Page: https:\/\/www\.oliant\.io\/oliant-form-usa/)
  })
})

describe("newsletter", () => {
  it("requires the terms checkbox", async () => {
    const emails: string[] = []
    const response = await handleNewsletter(
      post("http://local/api/forms/newsletter", ready({ email: "ada@example.com", terms: false })),
      now,
      async (email) => {
        emails.push(email)
      },
    )
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.match(body.fieldErrors.terms, /Terms/)
    assert.equal(emails.length, 0)
  })

  it("subscribes a valid address", async () => {
    const emails: string[] = []
    const response = await handleNewsletter(
      post("http://local/api/forms/newsletter", ready({ email: "  Ada@Example.com  ", terms: true })),
      now,
      async (email) => {
        emails.push(email)
      },
    )
    assert.equal(response.status, 200)
    assert.deepEqual(emails, ["Ada@Example.com"])
  })

  it("returns the form error when the list rejects the address", async () => {
    const response = await handleNewsletter(
      post("http://local/api/forms/newsletter", ready({ email: "ada@example.com", terms: true })),
      now,
      async () => {
        throw new Error("list down")
      },
    )
    const body = await response.json()
    assert.equal(response.status, 500)
    assert.equal(body.message, FORM_ERROR)
    assert.deepEqual(body.fieldErrors, {})
  })
})

describe("spam checks", () => {
  it("accepts a filled honeypot without sending", async () => {
    const sent: FormEmail[] = []
    const response = await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({
          name: "Bot",
          email: "bot@example.com",
          message: "Buy now",
          hp_field: "http://spam.test",
          startedAt: now,
        }),
      ),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    assert.equal(response.status, 200)
    assert.equal((await response.json()).ok, true)
    assert.equal(sent.length, 0)
  })

  it("rejects a submit that is faster than the minimum", async () => {
    const sent: FormEmail[] = []
    const response = await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({ name: "Jane", email: "jane@example.com", message: "Hello", startedAt: now - 500 }),
      ),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.equal(body.message, FORM_ERROR)
    assert.deepEqual(body.fieldErrors, {})
    assert.equal(sent.length, 0)
  })

  it("rejects a missing or stale timestamp", async () => {
    const missing = await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({ name: "Jane", email: "jane@example.com", message: "Hello", startedAt: undefined }),
      ),
      now,
      async () => {},
    )
    assert.equal(missing.status, 400)

    const stale = await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({
          name: "Jane",
          email: "jane@example.com",
          message: "Hello",
          startedAt: now - 48 * 60 * 60 * 1000,
        }),
      ),
      now,
      async () => {},
    )
    assert.equal(stale.status, 400)
  })

  it("rate limits an address after the allowed number of posts", async () => {
    const sent: FormEmail[] = []
    const ip = "198.51.100.20"
    const payload = ready({ name: "Jane", email: "jane@example.com", message: "Hello" })
    for (let i = 0; i < RATE_LIMIT; i += 1) {
      const response = await handleSchedule(
        post("http://local/api/forms/schedule-a-call", payload, ip),
        now,
        async (message) => {
          sent.push(message)
        },
      )
      assert.equal(response.status, 200)
    }
    const blocked = await handleSchedule(
      post("http://local/api/forms/schedule-a-call", payload, ip),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    assert.equal(blocked.status, 429)
    assert.equal(sent.length, RATE_LIMIT)
  })

  it("drops a javascript page url from the email body", async () => {
    const sent: FormEmail[] = []
    await handleSchedule(
      post(
        "http://local/api/forms/schedule-a-call",
        ready({
          name: "Jane",
          email: "jane@example.com",
          message: "Hello",
          pageUrl: "javascript:alert(1)",
        }),
      ),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    assert.match(sent[0].text, /Page: \n/)
    assert.doesNotMatch(sent[0].text, /javascript/)
  })
})

describe("helpers", () => {
  it("builds the subject and accepts only http(s) page urls", () => {
    assert.equal(formSubject("Schedule a Call", "Jane"), "[oliant.io] Schedule a Call — Jane")
    assert.equal(safePageUrl("https://www.oliant.io/schedule-a-call"), "https://www.oliant.io/schedule-a-call")
    assert.equal(safePageUrl("javascript:alert(1)"), "")
  })

  it("treats an already-subscribed Campaign Monitor response as success", () => {
    assert.equal(subscriberAccepted(201, "ada@example.com"), true)
    assert.equal(subscriberAccepted(400, { Code: 201, Message: "Already subscribed" }), true)
    assert.equal(subscriberAccepted(400, { Code: 206, Message: "Is Unsubscribed" }), false)
    assert.equal(subscriberAccepted(401, { Code: 201 }), false)
  })
})
