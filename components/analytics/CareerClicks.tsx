"use client"

import { useEffect } from "react"

import { trackEvent } from "@/lib/analytics"

export function CareerClicks() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest("[data-track='careers-click']")) return
      trackEvent("careers_click")
    }

    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  return null
}
