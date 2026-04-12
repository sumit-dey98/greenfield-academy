'use client'

import { forwardRef, useState } from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

const Input = forwardRef(function Input(
  {
    label,
    error,
    required,
    type = "text",
    className = "",
    hint,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword ? (showPassword ? "text" : "password") : type

  const inner = (
    <>
      <div className="relative flex items-center">
        <input
          ref={ref}
          type={inputType}
          required={required}
          className={`input ${isPassword ? "pr-10" : ""} ${error ? "border-danger focus:border-danger focus:shadow-none" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 text-faint hover:text-muted transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {hint && !error && <p className="text-xs text-faint">{hint}</p>}
      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </p>
      )}
    </>
  )

  if (!label) return inner

  return (
    <div className="flex flex-col w-full gap-1.5">
      <label className="text-xs font-semibold text-text">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {inner}
    </div>
  )
})

export default Input