import { POST as handleSchedule } from "@/lib/forms/schedule"

export function POST(request: Request) {
  return handleSchedule(request)
}
