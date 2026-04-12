'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Calendar, Tag, ArrowRight } from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import Carousel from "@/components/ui/Carousel"

const CATEGORIES = ["All", "Sports", "Academic", "Cultural", "General"]

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order("date", { ascending: false })
      if (data) setEvents(data)
      setLoading(false)
    }
    fetch()
  }, [])

  const latest = events.slice(0, 3)
  const filtered = activeCategory === "All"
    ? events
    : events.filter(e => e.category === activeCategory)

  const categoryColor = {
    Sports: { bg: "#d1fae5", color: "#065f46" },
    Academic: { bg: "#dbeafe", color: "#1e40af" },
    Cultural: { bg: "#ede9fe", color: "#5b21b6" },
    General: { bg: "#fef3c7", color: "#92400e" },
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <main className="flex-1">

        {/* Hero carousel */}
        <div className="relative">
          {loading ? (
            <div className="w-full bg-surface-2 animate-pulse h-80 md:h-[600px]" />
          ) : (
            <Carousel
              slides={latest}
              variant="feed"
              height="h-80 md:h-[600px]"
              interval={5000}
            />
          )}

          {/* Overlay header text */}
          <div className="absolute top-0 left-0 right-0 px-6 pt-8 z-10 pointer-events-none">
            <div className="max-w-6xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-semibold">
                Latest Events
              </div>
            </div>
          </div>
        </div>

        {/* Events grid */}
        <section className="py-10 md:py-14 px-6 md:px-12">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">

            {/* Section header + filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-text">All Events</h2>
                <p className="text-sm text-muted mt-1">
                  {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                  {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
                </p>
              </div>
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
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="card h-72 bg-surface-2 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-10 md:py-20 gap-3 text-center">
                <Tag size={36} className="text-faint" />
                <p className="text-muted text-sm">No events found in this category.</p>
                <button
                  onClick={() => setActiveCategory("All")}
                  className="btn btn-outline text-xs"
                >
                  View all events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(event => {
                  const cat = categoryColor[event.category] ?? categoryColor.General
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="card p-0 overflow-hidden flex flex-col no-underline group transition-all duration-200 hover:bg-surface hover:ring hover:ring-surface-2"
                    >
                      {/* Cover image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.cover_image}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ background: cat.bg, color: cat.color }}
                          >
                            {event.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-2 p-4 flex-1">
                        <div className="flex items-center gap-1.5 text-sm text-faint">
                          <Calendar size={11} />
                          {new Date(event.date).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </div>
                        <h3 className="font-semibold text-text text-base leading-snug line-clamp-2">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted leading-relaxed line-clamp-3 flex-1">
                          {event.excerpt}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-primary font-medium mt-4">
                          Read more <ArrowRight size={12} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}