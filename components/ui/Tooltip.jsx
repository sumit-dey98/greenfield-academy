'use client'

import { useState } from "react"
import { Info } from "lucide-react"

// Small hover/focus tooltip, triggered by an info icon. Use next to a label instead of
// a persistent hint line when the text is supplementary, not a validation/help message.
export default function Tooltip({ text, className = "" }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        tabIndex={0}
        className="text-faint hover:text-muted transition-colors"
        aria-label={text}
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2
            bg-text text-bg text-xs leading-relaxed rounded-md shadow-lg z-50 pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  )
}
