'use client'

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

export default function Testimonials({onReady}) {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  )

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: true })
      if (data) setTestimonials(data)
      setLoading(false)
    }
    fetch()
    onReady?.()
  }, [])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (loading || testimonials.length === 0) return null

  const NavButton = ({ onClick, label, children }) => (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-surface border border-border shadow-card text-muted hover:text-text hover:border-primary flex items-center justify-center transition-all duration-200 shrink-0"
      aria-label={label}
    >
      {children}
    </button>
  )

  return (
    <section className="bg-bg border-t border-surface-2 py-10 md:py-20 px-6 md:px-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
            Testimonials
          </div>
          <h2 className="text-3xl font-bold text-text">
            What parents say about us
          </h2>
        </div>

        {/* Carousel — chevrons absolutely positioned on md+ */}
        <div className="relative">

          {/* md+: absolute chevrons on sides */}
          <button
            onClick={scrollPrev}
            className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 -translate-x-4 w-9 h-9 rounded-full bg-surface border border-border shadow-card text-muted hover:text-text hover:border-primary items-center justify-center transition-all duration-200 z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>

          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="flex-none w-full md:w-[calc(50%-8px)] px-2"
                >
                  <div className="card flex flex-col gap-4 py-8 px-6 relative h-full select-none cursor-grab">

                    {/* Quote icon */}
                    <div className="absolute top-5 right-5 text-primary opacity-10">
                      <Quote size={36} />
                    </div>

                    {/* Avatar + name */}
                    <div className="flex items-center gap-3">
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-12 h-12 rounded-full bg-surface-2 shrink-0 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {t.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-text text-sm">{t.name}</p>
                        <p className="text-xs text-faint">Parent · {t.child_class}</p>
                      </div>
                    </div>

                    {/* Quote */}
                    <p className="text-sm text-muted leading-relaxed italic relative z-10 flex-1">
                      "{t.quote}"
                    </p>

                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={scrollNext}
            className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 translate-x-4 w-9 h-9 rounded-full bg-surface border border-border shadow-card text-muted hover:text-text hover:border-primary items-center justify-center transition-all duration-200 z-10"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Dots row */}
        <div className="flex items-center justify-center gap-3">

          {/* chevron left mobile */}
          <button
            onClick={scrollPrev}
            className="md:hidden w-9 h-9 rounded-full bg-surface border border-border shadow-card text-muted hover:text-text hover:border-primary flex items-center justify-center transition-all duration-200 shrink-0"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`rounded-full transition-all duration-300 ${i === selectedIndex
                    ? "w-5 h-1.5 bg-primary"
                    : "w-1.5 h-1.5 bg-border hover:bg-muted"
                  }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          {/* chevron right mobile */}
          <button
            onClick={scrollNext}
            className="md:hidden w-9 h-9 rounded-full bg-surface border border-border shadow-card text-muted hover:text-text hover:border-primary flex items-center justify-center transition-all duration-200 shrink-0"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>

        </div>

      </div>
    </section>
  )
}