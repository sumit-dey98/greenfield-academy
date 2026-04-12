'use client'

import { forwardRef, useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, X } from "lucide-react"
import Select from "@/components/ui/Select"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

const MONTH_OPTIONS = MONTHS.map((m, i) => ({
  label: m,
  value: String(i),
  short: m.slice(0, 3),
}))

function getYearOptions() {
  const current = new Date().getFullYear()
  return Array.from({ length: 100 }, (_, i) => {
    const y = current - i
    return { label: String(y), value: String(y) }
  })
}

const YEAR_OPTIONS = getYearOptions()

function parseDate(val) {
  if (!val) return null
  const [d, m, y] = val.split("/").map(Number)
  if (!d || !m || !y) return null
  const date = new Date(y, m - 1, d)
  return isNaN(date.getTime()) ? null : date
}

function formatDate(date) {
  if (!date) return ""
  const d = String(date.getDate()).padStart(2, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function sameDay(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function CalendarGrid({ year, month, selected, onSelect, minDate, maxDate, rangeStart, rangeEnd, hover, onHover }) {
  const today = new Date()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : new Date(year, month, i - firstDay + 1)
  )

  const isDisabled = (date) => {
    if (!date) return true
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const isInRange = (date) => {
    if (!date || !rangeStart) return false
    const end = rangeEnd ?? hover
    if (!end) return false
    const lo = rangeStart < end ? rangeStart : end
    const hi = rangeStart < end ? end : rangeStart
    return date > lo && date < hi
  }

  return (
    <>
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-faint py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const isSelected = sameDay(date, selected) || sameDay(date, rangeStart) || sameDay(date, rangeEnd)
          const isToday = sameDay(date, today)
          const disabled = isDisabled(date)
          const inRange = isInRange(date)
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              onMouseEnter={() => onHover?.(date)}
              onMouseLeave={() => onHover?.(null)}
              className={`h-8 w-8 rounded-md text-xs font-medium transition-colors duration-100
                ${isSelected
                  ? "bg-primary text-white"
                  : inRange
                    ? "bg-primary-light text-primary"
                    : isToday
                      ? "border border-primary text-primary hover:bg-primary-light"
                      : disabled
                        ? "text-faint cursor-not-allowed"
                        : "text-text hover:bg-surface-2"
                }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </>
  )
}

function SinglePicker({ value, onChange, minDate, maxDate }) {
  const selected = parseDate(value)
  const today = new Date()
  const [viewing, setViewing] = useState(selected ?? today)
  const year = viewing.getFullYear()
  const month = viewing.getMonth()

  return (
    <div className="p-3 w-72">
      <div className="flex items-center justify-between mb-3 gap-2">
        <button type="button" onClick={() => setViewing(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-text transition-colors shrink-0">
          <ChevronLeft size={15} />
        </button>
        <div className="flex items-center gap-1 flex-1 justify-center">
          <div className="w-28">
            <Select
              options={MONTH_OPTIONS}
              value={String(month)}
              onChange={v => setViewing(new Date(year, Number(v), 1))}
              searchable={false}
              clearable={false}
              renderValue={opt => opt.short}
              className="h-8"
            />
          </div>
          <div className="w-20">
            <Select
              options={YEAR_OPTIONS}
              value={String(year)}
              onChange={v => setViewing(new Date(Number(v), month, 1))}
              searchable={false}
              clearable={false}
              className="h-8"
            />
          </div>
        </div>
        <button type="button" onClick={() => setViewing(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-text transition-colors shrink-0">
          <ChevronRight size={15} />
        </button>
      </div>
      <CalendarGrid
        year={year} month={month}
        selected={selected}
        onSelect={(date) => onChange(formatDate(date))}
        minDate={minDate} maxDate={maxDate}
      />
    </div>
  )
}

function RangePicker({ value = {}, onChange, minDate, maxDate }) {
  const startDate = parseDate(value.start)
  const endDate = parseDate(value.end)
  const today = new Date()
  const [hover, setHover] = useState(null)
  const [viewing, setViewing] = useState(
    startDate ?? new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const leftYear = viewing.getFullYear()
  const leftMonth = viewing.getMonth()
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear

  const handleDayClick = (date) => {
    if (!startDate || (startDate && endDate)) {
      onChange({ start: formatDate(date), end: "" })
    } else {
      if (date < startDate) {
        onChange({ start: formatDate(date), end: formatDate(startDate) })
      } else {
        onChange({ start: formatDate(startDate), end: formatDate(date) })
      }
    }
  }

  return (
    <div className="p-3">
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3 gap-1">
            <button type="button" onClick={() => setViewing(new Date(leftYear, leftMonth - 1, 1))}
              className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-text transition-colors shrink-0">
              <ChevronLeft size={15} />
            </button>
            <div className="flex items-center gap-1 flex-1 justify-center">
              <div className="w-28">
                <Select options={MONTH_OPTIONS} value={String(leftMonth)}
                  onChange={v => setViewing(new Date(leftYear, Number(v), 1))}
                  searchable={false} clearable={false}
                  renderValue={opt => opt.short} className="h-8" />
              </div>
              <div className="w-20">
                <Select options={YEAR_OPTIONS} value={String(leftYear)}
                  onChange={v => setViewing(new Date(Number(v), leftMonth, 1))}
                  searchable={false} clearable={false} className="h-8" />
              </div>
            </div>
          </div>
          <CalendarGrid year={leftYear} month={leftMonth}
            rangeStart={startDate} rangeEnd={endDate} hover={hover}
            onSelect={handleDayClick} onHover={setHover}
            minDate={minDate} maxDate={maxDate} />
        </div>

        <div className="w-px bg-border" />

        <div className="flex-1">
          <div className="flex items-center justify-between mb-3 gap-1">
            <div className="flex items-center gap-1 flex-1 justify-center">
              <div className="w-28">
                <Select options={MONTH_OPTIONS} value={String(rightMonth)}
                  onChange={v => setViewing(new Date(leftYear, Number(v) - 1, 1))}
                  searchable={false} clearable={false}
                  renderValue={opt => opt.short} className="h-8" />
              </div>
              <div className="w-20">
                <Select options={YEAR_OPTIONS} value={String(rightYear)}
                  onChange={v => setViewing(new Date(Number(v), leftMonth, 1))}
                  searchable={false} clearable={false} className="h-8" />
              </div>
            </div>
            <button type="button" onClick={() => setViewing(new Date(leftYear, leftMonth + 1, 1))}
              className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-text transition-colors shrink-0">
              <ChevronRight size={15} />
            </button>
          </div>
          <CalendarGrid year={rightYear} month={rightMonth}
            rangeStart={startDate} rangeEnd={endDate} hover={hover}
            onSelect={handleDayClick} onHover={setHover}
            minDate={minDate} maxDate={maxDate} />
        </div>
      </div>
    </div>
  )
}

const DatePicker = forwardRef(function DatePicker(
  {
    label, error, required, hint,
    value, onChange,
    range = false,
    minDate, maxDate,
    placeholder = "DD/MM/YYYY",
    disabled = false,
    className = "",
    ...props
  },
  ref
) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState({})
  const triggerRef = useRef(null)
  const calendarRef = useRef(null)

  const computeStyle = () => {
    if (!triggerRef.current) return {}
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const above = spaceBelow < 340
    return {
      position: "fixed",
      left: rect.left,
      zIndex: 50,
      ...(above
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }
      ),
    }
  }

  const handleOpen = () => {
    if (disabled) return
    if (!open) setDropStyle(computeStyle())
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        calendarRef.current?.contains(e.target) ||
        e.target.closest("[data-select-dropdown]") || 
        e.target.closest("[data-datepicker-calendar]") 
      ) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (calendarRef.current?.contains(e.target)) return
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

  const displayValue = range
    ? value?.start ? `${value.start}${value.end ? ` → ${value.end}` : " → ..."}` : ""
    : value ?? ""

  const handleClear = (e) => {
    e.stopPropagation()
    onChange(range ? { start: "", end: "" } : "")
  }

  const calendar = open ? (
    <div
      ref={calendarRef}
      data-datepicker-calendar
      style={dropStyle}
      className="bg-surface border border-border rounded-lg shadow-lg"
    >
      {range ? (
        <RangePicker value={value}
          onChange={(v) => { onChange(v); if (v.end) setOpen(false) }}
          minDate={minDate} maxDate={maxDate} />
      ) : (
        <SinglePicker value={value}
          onChange={(v) => { onChange(v); setOpen(false) }}
          minDate={minDate} maxDate={maxDate} />
      )}
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
        ref={(el) => { triggerRef.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el }}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`input flex items-center justify-between gap-2 text-left cursor-pointer
          ${error ? "border-danger" : ""}
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${className}`}
        {...props}
      >
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-faint shrink-0" />
          <span className={displayValue ? "text-text" : "text-faint"}>
            {displayValue || placeholder}
          </span>
        </div>
        {displayValue && (
          <span onClick={handleClear} className="text-faint hover:text-muted transition-colors p-0.5 rounded">
            <X size={13} />
          </span>
        )}
      </button>

      {typeof window !== "undefined" && createPortal(calendar, document.body)}

      {hint && !error && <p className="text-xs text-faint">{hint}</p>}
      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" />{error}
        </p>
      )}
    </div>
  )
})

export default DatePicker