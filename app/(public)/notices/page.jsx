'use client'

import { useEffect, useState } from "react"
import { getNotices } from "@/lib/api/public"
import { Bell, Calendar, ChevronDown, LayoutGrid, List, Search, X } from "lucide-react"
import Pagination, { toLimitOffset } from "@/components/ui/Pagination"

const DEFAULT_PAGE_SIZE = 10
const INITIAL_PREVIEW_SIZE = 6

const categoryMeta = {
  Event: { badge: "badge-info", bg: "#dbeafe", color: "#1e40af" },
  Exam: { badge: "badge-danger", bg: "#fee2e2", color: "#991b1b" },
  General: { badge: "badge-success", bg: "#d1fae5", color: "#065f46" },
  Meeting: { badge: "badge-warning", bg: "#fef3c7", color: "#92400e" },
  Holiday: { badge: "badge-info", bg: "#ede9fe", color: "#5b21b6" },
}

const CATEGORIES = ["All", "Event", "Exam", "General", "Meeting", "Holiday"]

function NoticeCard({ notice }) {
  const [open, setOpen] = useState(false)
  const cat = categoryMeta[notice.category] ?? categoryMeta.General
  const isExpired = notice.expires && new Date(notice.expires) < new Date()

  return (
    <div className={`card flex flex-col gap-0 overflow-hidden transition-all duration-200 hover:bg-surface-2 ${isExpired ? "opacity-60" : ""}`}>

      {/* Clickable header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-start gap-4 text-left w-full bg-transparent border-none cursor-pointer p-0"
      >
        {/* Left accent bar */}
        <div
          className="w-1 self-stretch rounded-full shrink-0"
          style={{ background: cat.color }}
        />

        <div className="flex-1 flex flex-col gap-2 py-1">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[12px] font-semibold px-2.5 py-1 rounded-full border"
              style={{ background: cat.bg, color: cat.color, borderColor: cat.color }}
            >
              {notice.category}
            </span>
            {notice.priority === "high" && (
              <span className="badge badge-danger">Urgent</span>
            )}
            {isExpired && (
              <span className="badge badge-warning">Expired</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-text text-base leading-snug pr-4">
            {notice.title}
          </h3>

          {/* Date row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
            <div className="flex items-center gap-1">
              <Calendar size={14} className="shrink-0 mb-0.5"
               />
              <span>
                {new Date(notice.date).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </div>

            {notice.expires && (
              <span className="flex items-center gap-1">
                <span className="text-faint/50">·</span>
                Expires {new Date(notice.expires).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={16}
          className="text-faint shrink-0 mt-1 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Expandable content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "400px" : "0px" }}
      >
        <div className="pt-4 mt-4 border-t border-border ml-5">
          <p className="text-sm text-muted leading-relaxed">
            {notice.content}
          </p>
        </div>
      </div>

    </div>
  )
}

function NoticeGridCard({ notice }) {
  const cat = categoryMeta[notice.category] ?? categoryMeta.General
  const isExpired = notice.expires && new Date(notice.expires) < new Date()

  return (
    <div className={`card flex flex-col gap-3 h-full ${isExpired ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[12px] font-semibold px-2.5 py-1 rounded-full border"
          style={{ background: cat.bg, color: cat.color, borderColor: cat.color }}
        >
          {notice.category}
        </span>
        {notice.priority === "high" && (
          <span className="badge badge-danger">Urgent</span>
        )}
        {isExpired && (
          <span className="badge badge-warning">Expired</span>
        )}
      </div>

      <h3 className="font-semibold text-text text-base leading-snug">
        {notice.title}
      </h3>

      <p
        className="text-sm text-muted leading-relaxed overflow-hidden"
        style={{ display: "-webkit-box", WebkitLineClamp: 8, WebkitBoxOrient: "vertical" }}
      >
        {notice.content}
      </p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint mt-auto pt-1">
        <div className="flex items-center gap-1">
          <Calendar size={14} className="shrink-0 mb-0.5" />
          <span>
            {new Date(notice.date).toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        </div>

        {notice.expires && (
          <span className="flex items-center gap-1">
            <span className="text-faint/50">·</span>
            Expires {new Date(notice.expires).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  )
}

export default function NoticesPage() {
  const [notices, setNotices] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [view, setView] = useState("list")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  // Before "Load more" is clicked, show a flat preview of the latest notices with
  // no pagination controls. Clicking it reveals full page navigation.
  const [paginationActive, setPaginationActive] = useState(false)

  // Debounce search input before it drives a server request.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  // Category/search change: reset back to the collapsed preview.
  useEffect(() => {
    setPage(1)
    setPaginationActive(false)
  }, [activeCategory, debouncedSearch])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const result = await getNotices({
          ...(paginationActive ? toLimitOffset(page, pageSize) : { limit: INITIAL_PREVIEW_SIZE, offset: 0 }),
          category: activeCategory === "All" ? undefined : activeCategory,
          title: debouncedSearch || undefined,
        })
        if (cancelled) return
        setNotices(result?.items ?? [])
        setTotal(result?.total ?? 0)
      } catch (err) {
        console.error("Failed to load notices:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeCategory, debouncedSearch, page, pageSize, paginationActive])

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setPage(1)
  }

  const handleLoadMore = () => {
    setPage(1)
    setPaginationActive(true)
  }

  return (
    <div className="flex-1 py-10 md:py-14 px-4 md:px-6">
      <div className={`mx-auto flex flex-col gap-8 ${view === "grid" ? "max-w-6xl" : "max-w-6xl"}`}>

        {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
              <Bell size={13} />
              School Notices
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">
              Notices & Announcements
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              Stay up to date with the latest news, events, and announcements
              from Greenfield Academy.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              type="text"
              placeholder="Search notices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filters + view toggle */}
          <div className="flex items-center justify-between gap-2 flex-wrap -mt-4">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 cursor-pointer
                    ${activeCategory === cat
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-muted border-border hover:text-text"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-1 border border-border rounded-sm p-1 bg-surface">
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={`p-1.5 rounded-sm transition-colors cursor-pointer ${view === "list" ? "bg-primary text-white" : "text-faint hover:text-muted"}`}
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={`p-1.5 rounded-sm transition-colors cursor-pointer ${view === "grid" ? "bg-primary text-white" : "text-faint hover:text-muted"}`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          {/* Count */}
          {!loading && (
            <p className="text-xs text-muted -mt-4">
              {total === 0
                ? "No notices found."
                : `${total} notice${total !== 1 ? "s" : ""}${activeCategory !== "All" ? ` in ${activeCategory}` : ""}${debouncedSearch ? ` matching "${debouncedSearch}"` : ""}`
              }
            </p>
          )}

          {/* List / Grid */}
          {loading ? (
            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card h-28 bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : notices.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-10 md:py-20 gap-3 text-center">
              <Bell size={36} className="text-faint" />
              <p className="text-muted text-sm">No notices found.</p>
              {(search || activeCategory !== "All") && (
                <button
                  onClick={() => { setSearch(""); setActiveCategory("All") }}
                  className="btn btn-outline text-xs mt-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notices.map(notice => (
                    <NoticeGridCard key={notice.id} notice={notice} />
                  ))}
                </div>
              ) : (
                notices.map(notice => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))
              )}

              {!paginationActive && notices.length < total && (
                <button
                  onClick={handleLoadMore}
                  className="btn btn-outline w-fit mx-auto justify-center mt-2"
                >
                  Load more
                  {/* <span className="text-xs">
                    ({total - notices.length} remaining)
                  </span> */}
                </button>
              )}

              {paginationActive && total > 0 && (
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                  itemLabel="notices"
                  className="border border-border rounded-md bg-text"
                />
              )}
            </div>

          )}

      </div>
    </div>
  )
}