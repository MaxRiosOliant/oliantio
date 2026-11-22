import { POST as handleUsa } from "@/lib/forms/usa"

export function POST(request: Request) {
  return handleUsa(request)
}
