'use client'

import { useRef, useState, useEffect } from "react"
import { ChevronDown, AlertCircle, X } from "lucide-react"

// options: [{ label, value }]. value: array of selected values.
export default function MultiSelect({
  label, error, required, hint,
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  const toggle = (val) => {
    if (value.includes(val)) onChange?.(value.filter(v => v !== val))
    else onChange?.([...value, val])
  }

  const removeOne = (e, val) => {
    e.stopPropagation()
    onChange?.(value.filter(v => v !== val))
  }

  const selectedOptions = options.filter(o => value.includes(o.value))

  const inner = (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`input flex items-center justify-between gap-2 min-h-[2.5rem] h-auto py-1.5 cursor-pointer text-left
          ${error ? "border-danger" : ""} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedOptions.map(o => (
              <span key={o.value} className="badge badge-info gap-1">
                {o.label}
                {!disabled && (
                  <X size={11} className="cursor-pointer" onClick={(e) => removeOne(e, o.value)} />
                )}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-faint">{placeholder}</span>
        )}
        <ChevronDown size={15} className={`text-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-surface border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-3 py-3 text-sm text-faint text-center">No options.</p>
          ) : (
            options.map(o => {
              const checked = value.includes(o.value)
              return (
                <label
                  key={o.value}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(o.value)}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className="text-text">{o.label}</span>
                </label>
              )
            })
          )}
        </div>
      )}
    </div>
  )

  if (!label) return inner

  return (
    <div className={`flex flex-col w-full gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-text">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {inner}
      {hint && !error && <p className="text-xs text-faint">{hint}</p>}
      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
