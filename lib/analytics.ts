export function trackEvent(name: string, params?: Record<string, string>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag("event", name, params)
}

declare global {
  interface Window {
    gtag?: (command: "event" | "js" | "config", ...args: unknown[]) => void
  }
}
