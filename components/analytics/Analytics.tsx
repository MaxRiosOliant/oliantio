import Script from "next/script"

import { CareerClicks } from "@/components/analytics/CareerClicks"
import { site } from "@/config/site"

const gaId = site.analytics.gaId
const ahrefsKey = site.analytics.ahrefsKey

export function Analytics() {
  return (
    <>
      {process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${gaId}');`}
          </Script>
          {ahrefsKey ? (
            <Script
              src="https://analytics.ahrefs.com/analytics.js"
              strategy="afterInteractive"
              data-key={ahrefsKey}
            />
          ) : null}
        </>
      ) : null}
      <CareerClicks />
    </>
  )
}
