'use client'

import { forwardRef, useState, useRef, useEffect } from "react"
import { Clock, AlertCircle, X } from "lucide-react"

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
    className = "",
    ...props
  },
  ref
) {
  const parsed = parseTime(value)
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)
  const [period, setPeriod] = useState(parsed.period)
  const containerRef = useRef(null)

  useEffect(() => {
    const p = parseTime(value)
    setHour(p.hour)
    setMinute(p.minute)
    setPeriod(p.period)
  }, [value])

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

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

  return (
    <div className="flex flex-col w-full" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-text mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
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

      {/* Dropdown */}
      {open && (
        <div className="relative z-50 h-0 overflow-visible">
          <div className="absolute top-1 left-0 bg-surface border border-border rounded-lg shadow-lg overflow-hidden w-64">

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
      )}

      {hint && !error && (
        <p className="text-xs text-faint mt-1">{hint}</p>
      )}
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