'use client'

import { useEffect, useRef, useState } from "react"
import { API_BASE } from "@/lib/api/config"

const HEALTH_POLL_INTERVAL = 5000
const MAX_WAIT = 120000
const FADE_DURATION = 400

// Cycled while waiting on the backend to wake up / the DB connection to establish
// (e.g. a Render free-tier cold start, which can take up to a minute or more).
const WAITING_MESSAGES = [
  "Please wait while the database connection is established...",
  "This might take a minute...",
  "The website will load automatically once the connection is established.",
]
const MESSAGE_ROTATE_INTERVAL = 3000
const TIMEOUT_MESSAGE = "Failed to establish a database connection. Loading the website anyway..."

export default function Preloader({ ready }) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [healthy, setHealthy] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const healthyRef = useRef(false)

  // Poll /health every 5s until it succeeds (or the max-wait timeout below gives up).
  useEffect(() => {
    let cancelled = false
    let pollTimer

    const poll = async () => {
      if (cancelled || healthyRef.current) return
      try {
        const controller = new AbortController()
        const abortTimer = setTimeout(() => controller.abort(), HEALTH_POLL_INTERVAL)
        const res = await fetch(`${API_BASE}/health`, { signal: controller.signal })
        clearTimeout(abortTimer)
        if (!cancelled && res.ok) {
          healthyRef.current = true
          setHealthy(true)
          return
        }
      } catch {
        // backend asleep/unreachable — keep polling until MAX_WAIT gives up
      }
      if (!cancelled && !healthyRef.current) {
        pollTimer = setTimeout(poll, HEALTH_POLL_INTERVAL)
      }
    }
    poll()

    return () => {
      cancelled = true
      clearTimeout(pollTimer)
    }
  }, [])

  // Rotate the waiting message while still polling.
  useEffect(() => {
    if (healthy || timedOut) return
    const t = setInterval(() => {
      setMessageIndex(i => (i + 1) % WAITING_MESSAGES.length)
    }, MESSAGE_ROTATE_INTERVAL)
    return () => clearInterval(t)
  }, [healthy, timedOut])

  // Hard cap: give up waiting on the backend after MAX_WAIT and enter anyway.
  useEffect(() => {
    let enterTimer
    const maxTimer = setTimeout(() => {
      if (healthyRef.current) return
      setTimedOut(true)
      // let the failure message be read briefly before entering
      enterTimer = setTimeout(() => {
        setFading(true)
        setTimeout(() => setVisible(false), FADE_DURATION)
      }, 2000)
    }, MAX_WAIT)

    return () => {
      clearTimeout(maxTimer)
      clearTimeout(enterTimer)
    }
  }, [])

  // Once the backend is healthy, still wait on the page's own data (`ready`) before hiding.
  useEffect(() => {
    if (!ready) return
    setFading(true)
    const t = setTimeout(() => setVisible(false), FADE_DURATION)
    return () => clearTimeout(t)
  }, [ready])

  if (!visible) return null

  const message = timedOut ? TIMEOUT_MESSAGE : WAITING_MESSAGES[messageIndex]

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg gap-5 px-6"
      style={{
        transition: `opacity ${FADE_DURATION}ms ease`,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white shrink-0">
          <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-text leading-tight">Greenfield</span>
          <span className="text-2xl font-bold text-primary leading-tight">Academy</span>
        </div>
      </div>

      <div className="flex gap-4 items-center max-w-md">
        {/* Spinner */}
        <div className="w-8 h-8 rounded-full border-2 border-surface-2 border-t-primary animate-spin shrink-0" />

        {/* Message */}
        <p
          key={message}
          className={`text-sm text-center sm:text-left ${timedOut ? "text-danger" : "text-muted animate-pulse"}`}
          style={{ transition: "opacity 0.3s ease" }}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
