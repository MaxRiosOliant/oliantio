import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { redirects } from "./config/redirects"

export function proxy(request: NextRequest) {
  const redirect = redirects.find(
    (item) => item.source === request.nextUrl.pathname,
  )
  if (!redirect) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = redirect.destination
  url.search = ""
  return NextResponse.redirect(url, redirect.permanent ? 308 : 307)
}

export const config = {
  matcher: "/all-articles",
}
