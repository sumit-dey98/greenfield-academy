'use client'

import { forwardRef } from "react"
import { AlertCircle } from "lucide-react"

const Radio = forwardRef(function Radio(
  {
    label,
    error,
    hint,
    checked,
    onChange,
    disabled = false,
    className = "",
    ...props
  },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`flex items-start gap-2.5 cursor-pointer group ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
        <div className="relative mt-0.5 shrink-0">
          <input
            ref={ref}
            type="radio"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150
            ${checked
              ? "border-primary"
              : error
                ? "border-danger"
                : "border-border group-hover:border-primary"
            }`}
          >
            {checked && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
        </div>
        {label && (
          <span className="text-sm text-text leading-snug select-none">{label}</span>
        )}
      </label>

      {hint && !error && (
        <p className="text-xs text-faint ml-6">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-danger flex items-center gap-1 ml-6">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
})

export default Radio