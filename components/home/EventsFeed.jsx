'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Carousel from "@/components/ui/Carousel"

export default function EventsFeed({onReady}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, slug, cover_image, category, date, excerpt")
        .eq("published", true)
        .order("date", { ascending: false })
        .limit(3)
      if (data) setEvents(data)
      setLoading(false)
    }
    fetch()
    onReady?.()
  }, [])

  return (
    <section className="bg-surface border-t border-border py-10 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-3 ring-1 ring-primary">
              Latest Events
            </div>
            <h2 className="text-3xl font-bold text-text">
              What's happening at Greenfield
            </h2>
          </div>
          <Link
            href="/events"
            className="btn btn-outline flex items-center gap-2 no-underline"
          >
            All Events <ArrowRight size={15} />
          </Link>
        </div>

        {/* Carousel */}
        {loading ? (
          <div className="w-full h-96 rounded-xl bg-surface-2 animate-pulse" />
        ) : events.length === 0 ? (
          <div className="card flex items-center justify-center py-16">
            <p className="text-muted text-sm">No events yet.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden shadow-lg">
            <Carousel
              slides={events}
              variant="feed"
                  height="h-80 md:h-[600px]"
              interval={5000}
            />
          </div>
        )}

      </div>
    </section>
  )
}