'use client'

import { useEffect, useState } from "react"
import { GraduationCap } from "lucide-react"

const MESSAGES = [
  { after: 0, text: "Loading..." },
  { after: 2000, text: "Loading data..." },
  { after: 4000, text: "Data is not fully loaded, entering anyway..." },
]
const MAX_WAIT = 5000   
const FADE_DURATION = 400  

export default function Preloader({ ready }) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [message, setMessage] = useState(MESSAGES[0].text)

  useEffect(() => {
    const timers = MESSAGES.slice(1).map(({ after, text }) =>
      setTimeout(() => setMessage(text), after)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const maxTimer = setTimeout(() => triggerFade(), MAX_WAIT)

    if (ready) {
      clearTimeout(maxTimer)
      triggerFade()
    }

    return () => clearTimeout(maxTimer)
  }, [ready])

  const triggerFade = () => {
    setFading(true)
    setTimeout(() => setVisible(false), FADE_DURATION)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg gap-5"
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

      {/* Spinner */}
      <div className="w-8 h-8 rounded-full border-2 border-surface-2 border-t-primary animate-spin" />

      {/* Message */}
      <p
        key={message}
        className="text-sm text-muted animate-pulse"
        style={{ transition: "opacity 0.3s ease" }}
      >
        {message}
      </p>
    </div>
  )
}