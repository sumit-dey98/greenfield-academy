'use client'

import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Info } from "lucide-react"

const WIDTH = 224

export default function Tooltip({ text, className = "" }) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState({})
  const triggerRef = useRef(null)
  const ariaLabel = typeof text === "string" ? text : "More information"

  const computeStyle = () => {
    if (!triggerRef.current) return {}
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceAbove = rect.top
    const above = spaceAbove > 60

    return {
      position: "fixed",
      left: Math.min(Math.max(rect.left + rect.width / 2 - WIDTH / 2, 8), window.innerWidth - WIDTH - 8),
      width: WIDTH,
      zIndex: 10000,
      ...(above
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }
      ),
    }
  }

  const show = () => {
    setStyle(computeStyle())
    setOpen(true)
  }
  const hide = () => setOpen(false)

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        tabIndex={0}
        onClick={(e) => e.preventDefault()}
        className="text-faint hover:text-muted transition-colors"
        aria-label={ariaLabel}
      >
        <Info size={13} />
      </button>
      {open && typeof window !== "undefined" && createPortal(
        <span
          role="tooltip"
          style={style}
          className="px-3 py-2 bg-text text-bg text-xs leading-relaxed rounded-sm shadow-lg pointer-events-none"
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  )
}
