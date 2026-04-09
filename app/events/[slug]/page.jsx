'use client'

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Calendar, Tag, ArrowLeft, ArrowRight } from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import Carousel from "@/components/ui/Carousel"
import DOMPurify from "dompurify"

export default function EventPostPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [images, setImages] = useState([])
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const fetch = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single()

      if (!eventData) { setLoading(false); return }
      setEvent(eventData)

      const { data: imageData } = await supabase
        .from("event_images")
        .select("*")
        .eq("event_id", eventData.id)
        .order("sort_order", { ascending: true })

      if (imageData) setImages(imageData.map(img => ({ url: img.url })))

      const { data: relatedData } = await supabase
        .from("events")
        .select("id, title, slug, cover_image, category, date, excerpt")
        .eq("published", true)
        .eq("category", eventData.category)
        .neq("id", eventData.id)
        .limit(3)

      if (relatedData) setRelated(relatedData)
      setLoading(false)
    }
    fetch()
  }, [slug])

  // Extract H2 headings from content for ToC
  useEffect(() => {
    if (!event?.content) return
    const parser = new DOMParser()
    const doc = parser.parseFromString(event.content, "text/html")
    const h2s = Array.from(doc.querySelectorAll("h2"))
    const extracted = h2s.map((h, i) => ({
      id: `heading-${i}`,
      label: h.textContent,
    }))
    setHeadings(extracted)
  }, [event])

  // Add IDs to rendered H2s and observe them
  useEffect(() => {
    if (!contentRef.current || !headings.length) return

    const h2s = contentRef.current.querySelectorAll("h2")
    h2s.forEach((el, i) => {
      el.id = `heading-${i}`
      el.style.scrollMarginTop = "5rem"
    })

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    )

    h2s.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [headings, event])

  const categoryColor = {
    Sports: { bg: "#d1fae5", color: "#065f46" },
    Academic: { bg: "#dbeafe", color: "#1e40af" },
    Cultural: { bg: "#ede9fe", color: "#5b21b6" },
    General: { bg: "#fef3c7", color: "#92400e" },
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted text-sm min-h-[50vh]">Loading...</div>
      </div>
      <Footer />
    </div>
  )

  if (!event) return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-sm">Event not found.</p>
        <Link href="/events" className="btn btn-outline">
          <ArrowLeft size={14} /> Back to Events
        </Link>
      </div>
      <Footer />
    </div>
  )

  const cat = categoryColor[event.category] ?? categoryColor.General
  const content = typeof window !== "undefined"
    ? DOMPurify.sanitize(event.content ?? "")
    : event.content ?? ""

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <main className="flex-1">

        {/* Cover image */}
        <div className="w-full h-72 md:h-[600px] overflow-hidden relative">
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(5,46,22,0.7) 0%, transparent 60%)",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: cat.bg, color: cat.color }}
              >
                {event.category}
              </span>
              <span className="text-xs text-white/60 flex items-center gap-1">
                <Calendar size={11} />
                {new Date(event.date).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight max-w-3xl">
              {event.title}
            </h1>
            {event.author_name && (
              <p className="text-sm text-white/60 mt-2">
                By {event.author_name}
              </p>
            )}
          </div>
        </div>

        {/* Body — three column layout */}
        <div className="max-w-screen-2xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-8 items-start">

            {/* Left aside — ToC */}
            <aside className="hidden lg:block sticky top-24 self-start">
              <div className="card p-4 flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  Contents
                </h4>
                {headings.length === 0 ? (
                  <p className="text-xs text-faint">No sections found.</p>
                ) : (
                  headings.map(h => (
                    <Link
                      key={h.id}
                      href={`#${h.id}`}
                      className={`text-xs leading-snug no-underline transition-colors duration-150 py-0.5 border-l-2 pl-2 ${activeId === h.id
                        ? "text-primary border-primary font-medium"
                        : "text-muted border-transparent hover:text-text hover:border-border"
                        }`}
                    >
                      {h.label}
                    </Link>
                  ))
                )}
              </div>

              {/* Back link */}
              <Link
                href="/events"
                className="flex items-center gap-1.5 text-xs text-muted hover:text-text mt-4 no-underline transition-colors"
              >
                <ArrowLeft size={13} /> All Events
              </Link>
            </aside>

            {/* Main content */}
            <article className="min-w-0 flex flex-col ">

              {/* Excerpt */}
              <p className="text-base text-muted leading-relaxed border-l-4 border-primary pl-4 italic mb-8">
                {event.excerpt}
              </p>

              {/* Image carousel */}
              {images.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold text-text text-sm">
                    Event Gallery
                  </h3>
                  <div className="rounded-lg overflow-hidden">
                    <Carousel
                      slides={images}
                      variant="post"
                      height="h-80 md:h-[600px]"
                      interval={4000}
                    />
                  </div>
                </div>
              )}

              {/* Rich text content */}
              <div
                ref={contentRef}
                className="prose-content text-text"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </article>

            {/* Right aside — related events */}
            <aside className="hidden lg:block sticky top-24 self-start">
              <div className="card p-4 flex flex-col gap-4">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wide">
                  More Events
                </h4>
                {related.length === 0 ? (
                  <p className="text-xs text-faint">No related events.</p>
                ) : (
                  related.map(rel => (
                    <Link
                      key={rel.id}
                      href={`/events/${rel.slug}`}
                      className="flex flex-col gap-1.5 no-underline group"
                    >
                      <div className="w-full h-24 rounded-md overflow-hidden">
                        <img
                          src={rel.cover_image}
                          alt={rel.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <p className="text-xs font-medium text-text leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {rel.title}
                      </p>
                      <span className="text-xs text-faint flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(rel.date).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </Link>
                  ))
                )}

                <Link
                  href="/events"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 no-underline font-medium"
                >
                  All events <ArrowRight size={11} />
                </Link>
              </div>
            </aside>

          </div>
        </div >

      </main >

      <Footer />
    </div >
  )
}