import { POST as handleNewsletter } from "@/lib/forms/subscribe"

export function POST(request: Request) {
  return handleNewsletter(request)
}
