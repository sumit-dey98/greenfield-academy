'use client'

import { useState, useRef } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import Pagination from "@/components/ui/Pagination"

const MIN_COL_WIDTH = 60

export default function DataTable({
  columns = [],
  data = [],
  pageSize = 10,
  loading = false,
  emptyMessage = "No records found.",
  // --- Server-driven pagination (optional) ---
  serverMode = false,
  total = 0,
  page: serverPage = 1,
  onPageChange,
  onPageSizeChange,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState("asc")
  const [clientPage, setClientPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(pageSize)
  const [colWidths, setColWidths] = useState(() =>
    Object.fromEntries(columns.map(c => [c.key, c.width ?? 150]))
  )
  const resizing = useRef(null)

  const page = serverMode ? serverPage : clientPage
  const setPage = serverMode
    ? (p) => onPageChange?.(typeof p === "function" ? p(page) : p)
    : setClientPage

  const handleSort = (key) => {
    if (serverMode || !key) return
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
    setPage(1)
  }

  const sorted = serverMode
    ? data
    : [...data].sort((a, b) => {
        if (!sortKey) return 0
        const av = a[sortKey] ?? ""
        const bv = b[sortKey] ?? ""
        if (av === bv) return 0
        const result = av > bv ? 1 : -1
        return sortDir === "asc" ? result : -result
      })

  // In server mode `total` is the full row count; `sorted` is just the current page.
  const rowCount = serverMode ? total : sorted.length
  const paginated = serverMode
    ? sorted
    : sorted.slice((page - 1) * currentPageSize, page * currentPageSize)

  const handlePageSizeChange = (size) => {
    setCurrentPageSize(size)
    setPage(1)
    if (serverMode) onPageSizeChange?.(size)
  }

  const handleResizeStart = (e, key) => {
    e.preventDefault()
    const startX = e.clientX ?? e.touches?.[0]?.clientX
    // Read the starting width from within the updater so this handler doesn't need to
    // close over `colWidths` (which lets the React Compiler optimize the component).
    let startWidth = null

    const onMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX
      setColWidths(prev => {
        if (startWidth === null) startWidth = prev[key] ?? 150
        return { ...prev, [key]: Math.max(MIN_COL_WIDTH, startWidth + clientX - startX) }
      })
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
  }

  const skeletonRows = Array.from({ length: 6 })

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={13} className="text-faint" />
    return sortDir === "asc"
      ? <ChevronUp size={13} className="text-primary" />
      : <ChevronDown size={13} className="text-primary" />
  }

  return (
    <div className="p-0 flex flex-col table-wrapper">
      <div className="overflow-x-auto">
        <table className="table" style={{ tableLayout: "fixed", minWidth: "100%" }}>
          <colgroup>
            {columns.map(col => (
              <col key={col.key} style={{ width: colWidths[col.key] ?? 150 }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={`relative select-none ${i === 0 ? "rounded-tl-md" : ""} ${i === columns.length - 1 ? "rounded-tr-md" : ""}`}
                  style={{ width: colWidths[col.key] ?? 150 }}
                >
                  <div
                    className={`flex items-center gap-1.5 ${col.sortable && !serverMode ? "cursor-pointer hover:text-text" : ""}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="truncate">{col.label}</span>
                    {col.sortable && !serverMode && <SortIcon colKey={col.key} />}
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

      {!loading && (
        <Pagination
          page={page}
          pageSize={currentPageSize}
          total={rowCount}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          className="border-t border-border shrink-0 bg-text rounded-b-sm"
        />
      )}
    </div>
  )
}