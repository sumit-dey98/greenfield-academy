'use client'

import { useEffect, useId, useRef } from "react"
import Script from "next/script"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// Cloudflare Turnstile widget. Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset —
// the backend's verify_captcha() is a no-op in that case too, so an unconfigured environment
// (e.g. local dev) degrades gracefully on both sides without any code change.
export default function Turnstile({ onVerify, onExpire }) {
  const containerId = useId().replace(/:/g, "")
  const widgetIdRef = useRef(null)

  const renderWidget = () => {
    if (!window.turnstile || widgetIdRef.current !== null) return
    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey: SITE_KEY,
      callback: (token) => onVerify?.(token),
      "expired-callback": () => onExpire?.(),
      "error-callback": () => onExpire?.(),
    })
  }

  useEffect(() => {
    if (window.turnstile) renderWidget()
    return () => {
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!SITE_KEY) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div id={containerId} />
    </>
  )
}
