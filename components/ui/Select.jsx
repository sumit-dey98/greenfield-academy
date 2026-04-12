'use client'

import { forwardRef, useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search, Check, AlertCircle, X } from "lucide-react"

const DROPDOWN_HEIGHT = 240

const Select = forwardRef(function Select(
  {
    label, error, required, hint,
    options = [],
    value, onChange,
    placeholder = "Select an option",
    searchable = true,
    clearable = true,
    renderValue,     
    disabled = false,
    className = "",
    ...props        
  },
  ref
) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState({})
  const [query, setQuery] = useState("")
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  const selected = options.find(o => (typeof o === "string" ? o : o.value) === value)
  const selectedLabel = selected ? (typeof selected === "string" ? selected : selected.label) : null

  const filtered = options.filter(o => {
    const lbl = typeof o === "string" ? o : o.label
    return lbl.toLowerCase().includes(query.toLowerCase())
  })

  const handleSelect = (opt) => {
    onChange?.(typeof opt === "string" ? opt : opt.value)
    setOpen(false)
    setQuery("")
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange?.("")
  }

  const computeStyle = () => {
    if (!triggerRef.current) return {}
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const above = spaceBelow < DROPDOWN_HEIGHT + 12
    return {
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 100,
      ...(above
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }
      ),
    }
  }

  const handleToggle = () => {
    if (disabled) return
    if (!open) setDropStyle(computeStyle())
    setOpen(o => !o)
    setQuery("")
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target) ||
        e.target.closest("[data-datepicker-calendar]")  
      ) return
      setOpen(false)
      setQuery("")
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current?.contains(e.target)) return
      setDropStyle(computeStyle())
    }
    window.addEventListener("scroll", handler, true)
    return () => window.removeEventListener("scroll", handler, true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = () => setDropStyle(computeStyle())
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [open])

  useEffect(() => {
    if (open && searchable) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open, searchable])

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") { setOpen(false); setQuery("") }
    if (e.key === "Enter" && !open) setOpen(true)
  }, [open])

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      data-select-dropdown 
      style={dropStyle}
      className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
    >
      {searchable && (
        <div className="flex items-center gap-2 py-2 border-b border-border">
          <Search size={13} className="text-faint shrink-0 ml-3" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 text-sm bg-transparent outline-none text-text placeholder:text-faint"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-faint hover:text-muted">
              <X size={13} />
            </button>
          )}
        </div>
      )}
      <div className="max-h-52 overflow-y-auto" role="listbox">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted text-center">No options found.</div>
        ) : (
          filtered.map((opt, i) => {
            const optVal = typeof opt === "string" ? opt : opt.value
            const optLabel = typeof opt === "string" ? opt : opt.label
            const isActive = optVal === value
            return (
              <button
                key={i}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors duration-100
                  ${isActive ? "bg-primary-light text-primary font-medium" : "text-text hover:bg-surface-2"}`}
              >
                {optLabel}
                {isActive && <Check size={13} className="text-primary shrink-0" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  ) : null

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="text-xs font-semibold text-text mb-1.5">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <button
        ref={(el) => {
          triggerRef.current = el
          if (typeof ref === "function") ref(el)
          else if (ref) ref.current = el
        }}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`input flex items-center justify-between gap-2 text-left cursor-pointer
          ${error ? "border-danger" : ""}
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...props}
      >
        <span className={selectedLabel ? "text-text" : "text-faint"}>
          {selectedLabel
            ? (renderValue ? renderValue(selected) : selectedLabel)
            : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && clearable && (
            <span onClick={handleClear} className="text-faint hover:text-muted transition-colors p-0.5 rounded cursor-pointer">
              <X size={13} />
            </span>
          )}
          <ChevronDown size={15} className={`text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {typeof window !== "undefined" && createPortal(dropdown, document.body)}

      {hint && !error && <p className="text-xs text-faint mt-1">{hint}</p>}
      {error && (
        <p className="text-xs text-danger flex items-center gap-1 mt-1">
          <AlertCircle size={11} className="shrink-0" />{error}
        </p>
      )}
    </div>
  )
})

export default Select