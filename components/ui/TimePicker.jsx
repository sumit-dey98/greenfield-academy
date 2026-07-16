'use client'

import { forwardRef, useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Clock, AlertCircle, X } from "lucide-react"
import Tooltip from "@/components/ui/Tooltip"

const HOURS = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, "0"))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

function parseTime(val) {

  if (!val) return { hour: "12", minute: "00", period: "AM" }
  const [h, m] = val.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return { hour: "12", minute: "00", period: "AM" }
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(m).padStart(2, "0"),
    period,
  }
}

function formatTime24(hour, minute, period) {
  let h = Number(hour)
  if (period === "AM" && h === 12) h = 0
  if (period === "PM" && h !== 12) h += 12
  return `${String(h).padStart(2, "0")}:${minute}`
}

function formatDisplay(hour, minute, period) {
  return `${hour}:${minute} ${period}`
}

const TimePicker = forwardRef(function TimePicker(
  {
    label,
    error,
    required,
    hint,
    value,
    onChange,
    placeholder = "HH:MM AM/PM",
    disabled = false,
    isPortal = true,
    menuPlacement = "auto",   // "auto" | "top" | "bottom"
    menuPosition = "fixed",   // "fixed" | "absolute"
    className = "",
    ...props
  },
  ref
) {
  const parsed = parseTime(value)
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState({})
  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)
  const [period, setPeriod] = useState(parsed.period)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const p = parseTime(value)
    setHour(p.hour)
    setMinute(p.minute)
    setPeriod(p.period)
  }, [value])

  const computeStyle = () => {
    if (!triggerRef.current) return {}
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    let above = false
    if (menuPlacement === "top") above = true
    else if (menuPlacement === "bottom") above = false
    else above = spaceBelow < 280 && spaceAbove > spaceBelow

    if (menuPosition === "absolute") {
      return {
        position: "absolute",
        left: 0,
        zIndex: 50,
        ...(above ? { bottom: "100%", marginBottom: 4 } : { top: "100%", marginTop: 4 }),
      }
    }

    return {
      position: "fixed",
      left: rect.left,
      zIndex: 10000,
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
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current?.contains(e.target)) return
      if (dropdownRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (!open || menuPosition === "absolute") return
    const handler = (e) => {
      if (dropdownRef.current?.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener("scroll", handler, true)
    return () => window.removeEventListener("scroll", handler, true)
  }, [open, menuPosition])

  useEffect(() => {
    if (!open || menuPosition === "absolute") return
    const handler = () => setDropStyle(computeStyle())
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [open, menuPosition])

  const handleSelect = (newHour, newMinute, newPeriod) => {
    const h = newHour ?? hour
    const m = newMinute ?? minute
    const p = newPeriod ?? period
    setHour(h)
    setMinute(m)
    setPeriod(p)
    onChange(formatTime24(h, m, p))
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setHour("12")
    setMinute("00")
    setPeriod("AM")
    onChange("")
  }

  const displayValue = value ? formatDisplay(hour, minute, period) : ""

  const wrapperClass = menuPosition === "absolute" ? "relative" : ""

  const dropdownNode = open ? (
    <div ref={dropdownRef} style={dropStyle} className="w-64">
      <div className="bg-surface border border-border rounded-sm shadow-drop overflow-hidden">

        {/* Preview */}
        <div className="px-4 py-3 border-b border-border bg-surface2 flex items-center justify-between">
          <span className="text-lg font-bold text-text tracking-wide">
            {hour}:{minute}
          </span>
          {/* AM/PM toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
            {["AM", "PM"].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => handleSelect(undefined, undefined, p)}
                className={`px-3 py-1.5 transition-colors duration-150
                  ${period === p
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:bg-surface2"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Hour + Minute columns */}
        <div className="flex">

          {/* Hours */}
          <div className="flex-1 flex flex-col border-r border-border">
            <div className="text-xs font-semibold text-faint text-center py-1.5 border-b border-border">
              Hour
            </div>
            <div className="overflow-y-auto max-h-48 py-1">
              {HOURS.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelect(h, undefined, undefined)}
                  className={`w-full text-center text-sm py-1.5 transition-colors duration-100
                    ${hour === h
                      ? "bg-primary text-white font-semibold"
                      : "text-text hover:bg-surface2"
                    }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes */}
          <div className="flex-1 flex flex-col">
            <div className="text-xs font-semibold text-faint text-center py-1.5 border-b border-border">
              Minute
            </div>
            <div className="overflow-y-auto max-h-48 py-1">
              {MINUTES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelect(undefined, m, undefined)}
                  className={`w-full text-center text-sm py-1.5 transition-colors duration-100
                    ${minute === m
                      ? "bg-primary text-white font-semibold"
                      : "text-text hover:bg-surface2"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Done button */}
        <div className="px-3 py-2.5 border-t border-border">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-primary w-full justify-center text-xs py-1.5"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  ) : null

  return (
    <div className={`flex flex-col w-full ${wrapperClass}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-text mb-1.5 flex items-center gap-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
          {hint && <Tooltip text={hint} />}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={(el) => { triggerRef.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el }}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`input flex items-center justify-between gap-2 text-left cursor-pointer
          ${error ? "border-danger" : ""}
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${className}`}
        {...props}
      >
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-faint shrink-0" />
          <span className={displayValue ? "text-text" : "text-faint"}>
            {displayValue || placeholder}
          </span>
        </div>
        {displayValue && (
          <span
            onClick={handleClear}
            className="text-faint hover:text-muted transition-colors p-0.5 rounded"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {menuPosition === "absolute"
        ? dropdownNode
        : (isPortal && typeof window !== "undefined")
          ? createPortal(dropdownNode, document.body)
          : dropdownNode
      }

      {error && (
        <p className="text-xs text-danger flex items-center gap-1 mt-1">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
})

export default TimePicker
