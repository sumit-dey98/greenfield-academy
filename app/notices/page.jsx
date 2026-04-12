'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Bell, Calendar, ChevronDown, Search, X } from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

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
    <div className={`card flex flex-col gap-0 overflow-hidden transition-all duration-200 hover:bg-surface-2 hover:ring hover:ring-surface-2 ${isExpired ? "opacity-60" : ""}`}>

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

export default function NoticesPage() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [visible, setVisible] = useState(6)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("notices")
        .select("*")
        .order("date", { ascending: false })
      if (data) setNotices(data)
      setLoading(false)
    }
    fetch()
  }, [])

  useEffect(() => {
    setVisible(6)
  }, [search, activeCategory])

  const filtered = notices.filter(n => {
    const matchesCategory = activeCategory === "All" || n.category === activeCategory
    const matchesSearch = search === "" ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })
  const visibleNotices = filtered.slice(0, visible)

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <main className="flex-1 py-10 md:py-14 px-4 md:px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">

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

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap -mt-4">
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

          {/* Count */}
          {!loading && (
            <p className="text-xs text-muted -mt-4">
              {filtered.length === 0
                ? "No notices found."
                : `${filtered.length} notice${filtered.length !== 1 ? "s" : ""}${activeCategory !== "All" ? ` in ${activeCategory}` : ""}${search ? ` matching "${search}"` : ""}`
              }
            </p>
          )}

          {/* List */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card h-28 bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
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
              {visibleNotices.map(notice => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}

              {/* Load more */}
              {visible < filtered.length && (
                <button
                  onClick={() => setVisible(v => v + 6)}
                  className="btn btn-outline w-full justify-center"
                >
                  Load more
                  <span className="text-xs text-faint ml-1">
                    ({filtered.length - visible} remaining)
                  </span>
                </button>
              )}
            </div>

          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}