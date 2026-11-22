import { POST as handleContact } from "@/lib/forms/contact"

export function POST(request: Request) {
  return handleContact(request)
}
