'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, ArrowRight, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"

const categoryBadge = {
  Event: "badge-info",
  Exam: "badge-danger",
  General: "badge-success",
  Meeting: "badge-warning",
  Holiday: "badge-info",
}
export default function Notices({onReady}) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotices = async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("date", { ascending: false })
        .limit(3)

      if (!error) setNotices(data)
      setLoading(false)
    }
    fetchNotices()
    onReady?.()
  }, [])

  return (
    <section className="bg-bg py-10 md:py-20 px-6 md:px-12 border-t border-surface-2">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-3 ring-1 ring-primary">
              <Bell size={13} />
              Latest Updates
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-text">
              Notices & Announcements
            </h2>
          </div>
          <Link href="/notices" className="btn btn-outline">
            View All <ArrowRight size={15} />
          </Link>
        </div>

        {/* Notices grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-44 bg-surface-2 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {notices.map(notice => (
                <div
                  key={notice.id}
                  className="card flex flex-col gap-3 cursor-default transition-shadow duration-200 hover:ring-2 hover:ring-surface-2"
                >
                  <div className="flex justify-between items-center">
                    <span className={`badge ${categoryBadge[notice.category] ?? "badge-info"}`}>
                      {notice.category}
                    </span>
                    {notice.priority === "high" && (
                      <span className="badge badge-danger">Urgent</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-base text-text leading-snug">
                    {notice.title}
                  </h3>

                  <p className="text-sm text-muted leading-relaxed flex-1 line-clamp-3">
                    {notice.content}
                  </p>

                  <div className="flex items-center gap-1.5 text-faint text-xs mt-auto pt-3 border-t border-border">
                    <Calendar size={12} />
                    {new Date(notice.date).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  )
}