import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { beforeEach, describe, it } from "node:test"

import { handleContact } from "./contact.ts"
import { formSubject, safePageUrl, type FormEmail } from "./email.ts"
import { FORM_ERROR, formNames } from "./messages.ts"
import { subscriberAccepted } from "./newsletter.ts"
import { handleSchedule } from "./schedule.ts"
import { RATE_LIMIT, resetRateLimit } from "./spam.ts"
import { handleNewsletter } from "./subscribe.ts"
import { contactHrefForPath, contactTopicSlugs } from "./topics.ts"

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

function contactPayload(extra: Record<string, unknown> = {}) {
  return ready({
    name: "Jane Doe",
    email: "jane@example.com",
    company: "Acme",
    topic: "qa-testing",
    message: "We need a team for a new product.",
    consent: true,
    pageUrl: "https://www.oliant.io/contact-us",
    ...extra,
  })
}

describe("contact us", () => {
  it("returns field errors and does not send when the email is invalid", async () => {
    const sent: FormEmail[] = []
    const response = await handleContact(
      post("http://local/api/forms/contact-us", contactPayload({ email: "not-an-email" })),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.equal(body.message, FORM_ERROR)
    assert.match(body.fieldErrors.email, /email/i)
    assert.equal(sent.length, 0)
  })

  it("requires a name, a topic, consent, and a message of at least 20 characters", async () => {
    const response = await handleContact(
      post(
        "http://local/api/forms/contact-us",
        contactPayload({ name: "  ", topic: "", message: "a".repeat(19), consent: false }),
      ),
      now,
      async () => {},
    )
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.match(body.fieldErrors.name, /required/i)
    assert.match(body.fieldErrors.topic, /select/i)
    assert.match(body.fieldErrors.message, /20/)
    assert.match(body.fieldErrors.consent, /Privacy Policy/)
  })

  it("rejects a message over 2000 characters and a topic outside the list", async () => {
    const response = await handleContact(
      post(
        "http://local/api/forms/contact-us",
        contactPayload({ topic: "Spam", message: "a".repeat(2001) }),
      ),
      now,
      async () => {},
    )
    const body = await response.json()
    assert.match(body.fieldErrors.topic, /select/i)
    assert.match(body.fieldErrors.message, /2000/)
  })

  it("allows a blank company and emails every labeled field", async () => {
    const sent: FormEmail[] = []
    const response = await handleContact(
      post(
        "http://local/api/forms/contact-us",
        contactPayload({
          company: undefined,
          topic: "cloud",
          pageUrl: "https://www.oliant.io/contact-us?topic=cloud",
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
    assert.equal(email.subject, "[oliant.io] Contact: Cloud (Google Cloud, AWS, Azure) — Jane Doe")
    assert.match(email.text, /Name: Jane Doe/)
    assert.match(email.text, /Work email: jane@example.com/)
    assert.match(email.text, /Company: \n/)
    assert.match(email.text, /What can we help with\?: Cloud \(Google Cloud, AWS, Azure\)/)
    assert.match(email.text, /Message: We need a team for a new product\./)
    assert.match(email.text, /Consent: Yes/)
    assert.match(email.text, /Page: https:\/\/www\.oliant\.io\/contact-us\?topic=cloud/)
    assert.match(email.text, /Submitted: 2026-11-21T18:00:00.000Z/)
    assert.doesNotMatch(email.text, /hp_field/)
  })

  it("keeps newlines out of the subject", async () => {
    const sent: FormEmail[] = []
    await handleContact(
      post(
        "http://local/api/forms/contact-us",
        contactPayload({ name: "Jane\r\nBcc: x" }),
      ),
      now,
      async (message) => {
        sent.push(message)
      },
    )
    assert.equal(sent[0].subject.includes("\n"), false)
    assert.equal(sent[0].subject.includes("\r"), false)
    assert.equal(sent[0].subject, `[oliant.io] Contact: QA & Testing — Jane Bcc: x`)
  })

  it("accepts a filled honeypot without sending", async () => {
    const sent: FormEmail[] = []
    const response = await handleContact(
      post(
        "http://local/api/forms/contact-us",
        contactPayload({ hp_field: "http://spam.test", startedAt: now }),
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

  it("returns the form error when email sending fails", async () => {
    const response = await handleContact(
      post("http://local/api/forms/contact-us", contactPayload()),
      now,
      async () => {
        throw new Error("mailbox down")
      },
    )
    const body = await response.json()
    assert.equal(response.status, 500)
    assert.equal(body.message, FORM_ERROR)
    assert.deepEqual(body.fieldErrors, {})
  })
})

function publishedServicePaths() {
  const directory = path.join(process.cwd(), "content", "services")
  const docs = readdirSync(directory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const text = readFileSync(path.join(directory, file), "utf8")
      const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ""
      return {
        slug: /^slug:\s*(\S+)/m.exec(frontmatter)?.[1],
        parent: /^parent:\s*(\S+)/m.exec(frontmatter)?.[1],
      }
    })
  const parents = new Set(docs.flatMap((doc) => (doc.parent ? [doc.parent] : [])))
  return docs.flatMap((doc) => {
    if (!doc.slug || parents.has(doc.slug)) return []
    return [doc.parent ? `/services/${doc.parent}/${doc.slug}` : `/services/${doc.slug}`]
  })
}

describe("contact topic links", () => {
  it("preselects a topic from each published service page", () => {
    const paths = publishedServicePaths()
    assert.equal(paths.length > 0, true)
    for (const servicePath of paths) {
      const href = contactHrefForPath(servicePath)
      const topic = new URL(href, "https://www.oliant.io").searchParams.get("topic")
      assert.equal(topic !== null && (contactTopicSlugs as readonly string[]).includes(topic), true, servicePath)
    }
  })

  it("leaves the topic off pages that are not a service", () => {
    assert.equal(contactHrefForPath("/contact-us"), "/contact-us")
    assert.equal(contactHrefForPath("/about-us"), "/contact-us")
    assert.equal(contactHrefForPath("/"), "/contact-us")
  })

  it("maps the main services and the cloud pages", () => {
    assert.equal(contactHrefForPath("/services/web"), "/contact-us?topic=web-development")
    assert.equal(contactHrefForPath("/services/qa"), "/contact-us?topic=qa-testing")
    assert.equal(contactHrefForPath("/services/development/aws"), "/contact-us?topic=cloud")
    assert.equal(contactHrefForPath("/services/development/react"), "/contact-us?topic=custom-development")
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
