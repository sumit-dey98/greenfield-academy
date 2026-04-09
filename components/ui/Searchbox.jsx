'use client'

import { forwardRef, useRef } from "react"
import { Search, X, AlertCircle } from "lucide-react"

const SearchBox = forwardRef(function SearchBox(
  {
    label,
    error,
    hint,
    value,
    onChange,
    onClear,
    placeholder = "Search...",
    disabled = false,
    className = "",
    ...props
  },
  ref
) {
  const inputRef = useRef(null)

  const handleClear = () => {
    onClear?.()
    onChange?.({ target: { value: "" } })
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-text">{label}</label>
      )}

      <div className="relative flex items-center">
        <Search
          size={15}
          className="absolute left-3 text-faint pointer-events-none"
        />
        <input
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
          }}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input pl-9 ${value ? "pr-9" : ""} ${error ? "border-danger focus:border-danger" : ""
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-faint hover:text-muted transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs text-faint">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
})

export default SearchBox