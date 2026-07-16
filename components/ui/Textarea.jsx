'use client'

import { forwardRef } from "react"
import { AlertCircle } from "lucide-react"
import Tooltip from "@/components/ui/Tooltip"

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    required,
    hint,
    rows = 4,
    className = "",
    ...props
  },
  ref
) {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="text-xs font-semibold text-text mb-1.5 flex items-center gap-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
          {hint && <Tooltip text={hint} />}
        </label>
      )}

      <textarea
        ref={ref}
        rows={rows}
        required={required}
        className={`input resize-y min-h-[100px] ${error ? "border-danger focus:border-danger focus:shadow-none" : ""
          } ${className}`}
        {...props}
      />

      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
})

export default Textarea