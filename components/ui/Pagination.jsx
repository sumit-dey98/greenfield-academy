'use client'

import { ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react"
import Select from "@/components/ui/Select"

const DEFAULT_PAGE_SIZE_OPTIONS = [
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
]

// Converts 1-indexed page/pageSize into the limit/offset shape the backend expects.
export function toLimitOffset(page, pageSize) {
  return { limit: pageSize, offset: (page - 1) * pageSize }
}

function getPageNumbers(page, totalPages) {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...")
      acc.push(p)
      return acc
    }, [])
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  itemLabel = "records",
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className={`flex items-center justify-between px-4 py-3 flex-wrap gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="text-xs text-surface-2">
          {total > 0 ? (
            <>
              Showing{" "}
              <span className="font-medium text-surface">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
              </span>
              {" "}of{" "}
              <span className="font-medium text-surface">{total}</span>
              {" "}{itemLabel}
            </>
          ) : (
            `Showing 0 of 0 ${itemLabel}`
          )}
        </span>
        {onPageSizeChange && (
          <div className="w-20">
            <Select
              options={pageSizeOptions}
              value={String(pageSize)}
              onChange={(v) => onPageSizeChange(Number(v))}
              searchable={false}
              clearable={false}
              className="h-8"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => onPageChange(1)} disabled={page === 1}
          className="p-1 h-7 w-7 flex items-center justify-center rounded text-xs border border-border bg-surface text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronsLeft size={15} />
        </button>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
          className="p-1 h-7 w-7 flex items-center justify-center rounded text-xs border border-border bg-surface text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={15} />
        </button>
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-faint">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`p-1 h-6 w-6 flex items-center justify-center rounded text-xs border transition-colors
                ${page === p ? "bg-primary text-white border-primary" : "border-border bg-surface text-muted hover:text-text"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="p-1 h-7 w-7 flex items-center justify-center rounded text-xs border border-border bg-surface text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={15} />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
          className="p-1 h-7 w-7 flex items-center justify-center rounded text-xs border border-border bg-surface text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  )
}

export { DEFAULT_PAGE_SIZE_OPTIONS }
