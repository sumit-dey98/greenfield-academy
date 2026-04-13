'use client'

import { useEffect } from "react"
import { X } from "lucide-react"

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-2xl",
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full ${width} bg-surface border border-border rounded-xl shadow-lg flex flex-col max-h-[90vh] overflow-hidden`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-surface-2 shrink-0">
          <h2 className="font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="text-faint hover:text-text transition-colors p-1 rounded-md hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <div className="px-4 sm:px-6 py-5 overflow-visible">
            {children}
          </div>
        </div>

      </div>
    </div>
  )
}