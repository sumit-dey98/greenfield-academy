'use client'

import { useState, useRef, useCallback } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import Select from "@/components/ui/Select"

const MIN_COL_WIDTH = 60

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
]

export default function DataTable({
  columns = [],
  data = [],
  pageSize = 10,
  loading = false,
  emptyMessage = "No records found.",
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState("asc")
  const [page, setPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(pageSize)
  const [colWidths, setColWidths] = useState(() =>
    Object.fromEntries(columns.map(c => [c.key, c.width ?? 150]))
  )
  const resizing = useRef(null)

  const handleSort = (key) => {
    if (!key) return
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
    setPage(1)
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const av = a[sortKey] ?? ""
    const bv = b[sortKey] ?? ""
    if (av === bv) return 0
    const result = av > bv ? 1 : -1
    return sortDir === "asc" ? result : -result
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / currentPageSize))
  const paginated = sorted.slice((page - 1) * currentPageSize, page * currentPageSize)

  const handleResizeStart = useCallback((e, key) => {
    e.preventDefault()
    const startX = e.clientX ?? e.touches?.[0]?.clientX
    const startWidth = colWidths[key] ?? 150

    const onMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX
      const newWidth = Math.max(MIN_COL_WIDTH, startWidth + clientX - startX)
      setColWidths(prev => ({ ...prev, [key]: newWidth }))
    }

    const onUp = () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend", onUp)
      resizing.current = null
    }

    resizing.current = key
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
    document.addEventListener("touchmove", onMove, { passive: false })
    document.addEventListener("touchend", onUp)
  }, [colWidths])

  const skeletonRows = Array.from({ length: 6 })

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={13} className="text-faint" />
    return sortDir === "asc"
      ? <ChevronUp size={13} className="text-primary" />
      : <ChevronDown size={13} className="text-primary" />
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...")
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="table" style={{ tableLayout: "fixed", minWidth: "100%" }}>
          <colgroup>
            {columns.map(col => (
              <col key={col.key} style={{ width: colWidths[col.key] ?? 150 }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="relative select-none" style={{ width: colWidths[col.key] ?? 150 }}>
                  <div
                    className={`flex items-center gap-1.5 ${col.sortable ? "cursor-pointer hover:text-text" : ""}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="truncate">{col.label}</span>
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </div>
                  <div
                    className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-col-resize group z-10"
                    onMouseDown={(e) => handleResizeStart(e, col.key)}
                    onTouchStart={(e) => handleResizeStart(e, col.key)}
                  >
                    <div className="w-px h-4 bg-border group-hover:bg-primary group-hover:h-full transition-all duration-150" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              skeletonRows.map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key}><div className="h-4 bg-surface-2 rounded animate-pulse w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-12 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map(col => (
                    <td key={col.key} className="truncate">
                      {col.render
                        ? col.render(row, (page - 1) * currentPageSize + i)
                        : <span className="text-sm text-text">{row[col.key] ?? "—"}</span>
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              Showing{" "}
              <span className="font-medium text-text">
                {(page - 1) * currentPageSize + 1}–{Math.min(page * currentPageSize, sorted.length)}
              </span>
              {" "}of{" "}
              <span className="font-medium text-text">{sorted.length}</span>
              {" "}records
            </span>
            <div className="w-20">
              <Select
                options={PAGE_SIZE_OPTIONS}
                value={String(currentPageSize)}
                onChange={(v) => { setCurrentPageSize(Number(v)); setPage(1) }}
                searchable={false}
                clearable={false}
                className="h-8"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-2 py-1 rounded text-xs border border-border bg-surface text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              «
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2.5 py-1 rounded text-xs border border-border bg-surface text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-xs text-faint">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors
                    ${page === p ? "bg-primary text-white border-primary" : "border-border bg-surface text-muted hover:text-text"}`}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2.5 py-1 rounded text-xs border border-border bg-surface text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="px-2 py-1 rounded text-xs border border-border bg-surface text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              »
            </button>
          </div>
        </div>
      )}
    </div>
  )
}