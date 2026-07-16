'use client'

import { useEffect, useState } from "react"
import { getEvents } from "@/lib/api/public"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Carousel from "@/components/ui/Carousel"
import Reveal from "@/components/ui/Reveal"

export default function EventsFeed({onReady}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const page = await getEvents({ limit: 3 })
        setEvents(page?.items ?? [])
      } catch (err) {
        console.error("Failed to load events:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
    onReady?.()
  }, [])

  return (
    <section className="bg-surface border-t border-border py-10 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <Reveal className="flex items-end justify-between flex-wrap gap-4">
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
        </Reveal>

        {/* Carousel */}
        {loading ? (
          <div className="w-full h-96 rounded-xl bg-surface-2 animate-pulse" />
        ) : events.length === 0 ? (
          <div className="card flex items-center justify-center py-16">
            <p className="text-muted text-sm">No events yet.</p>
          </div>
        ) : (
          <Reveal className="rounded-md overflow-hidden shadow-lg">
            <Carousel
              slides={events}
              variant="feed"
                  height="h-80 md:h-[600px]"
              interval={5000}
            />
          </Reveal>
        )}

      </div>
    </section>
  )
}