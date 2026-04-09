'use client'

import { forwardRef, useRef, useState } from "react"
import { Upload, FileText, X, AlertCircle, Image, File } from "lucide-react"

function fileIcon(file) {
  if (file.type.startsWith("image/")) return <Image size={15} className="text-primary" />
  if (file.type === "application/pdf") return <FileText size={15} className="text-danger" />
  return <File size={15} className="text-muted" />
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const FileUpload = forwardRef(function FileUpload(
  {
    label,
    error,
    required,
    hint,
    multiple = false,
    accept,
    maxSize,           
    maxFiles = 5,
    onChange,
    disabled = false,
    className = "",
    ...props
  },
  ref
) {
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [sizeError, setSizeError] = useState(null)
  const inputRef = useRef(null)

  const addFiles = (incoming) => {
    setSizeError(null)
    const arr = Array.from(incoming)

    const oversized = arr.filter(f => maxSize && f.size > maxSize)
    if (oversized.length > 0) {
      setSizeError(`${oversized.map(f => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the ${formatSize(maxSize)} limit.`)
      return
    }

    const next = multiple
      ? [...files, ...arr].slice(0, maxFiles)
      : [arr[0]]

    setFiles(next)
    onChange?.(multiple ? next : next[0] ?? null)
  }

  const removeFile = (i) => {
    const next = files.filter((_, idx) => idx !== i)
    setFiles(next)
    setSizeError(null)
    onChange?.(multiple ? next : next[0] ?? null)
  }

  const handleInput = (e) => addFiles(e.target.files)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    addFiles(e.dataTransfer.files)
  }

  const displayError = error || sizeError

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-text">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${dragging
            ? "border-primary bg-primary-light"
            : displayError
              ? "border-danger bg-surface"
              : "border-border bg-surface hover:border-primary hover:bg-primary-light"
          }
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${className}`}
      >
        <Upload size={22} className={dragging ? "text-primary" : "text-faint"} />
        <div className="text-center">
          <p className="text-sm text-muted">
            <span className="text-primary font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-faint mt-0.5">
            {accept ?? "Any file type"}
            {maxSize && ` · Max ${formatSize(maxSize)}`}
            {multiple && maxFiles && ` · Up to ${maxFiles} files`}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInput}
          className="hidden"
          disabled={disabled}
          {...props}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 bg-surface border border-border rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                {fileIcon(file)}
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{file.name}</p>
                  <p className="text-xs text-faint">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-faint hover:text-danger transition-colors shrink-0 ml-2"
                aria-label={`Remove ${file.name}`}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {hint && !displayError && (
        <p className="text-xs text-faint">{hint}</p>
      )}
      {displayError && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" />
          {displayError}
        </p>
      )}
    </div>
  )
})

export default FileUpload