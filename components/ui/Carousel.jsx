'use client'

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import Link from "next/link"

/**
 * Carousel — two variants:
 *
 * variant="feed"  — used on homepage EventsFeed and events listing page hero
 *   slides: [{ id, cover_image, title, slug, category, date }]
 *   Shows overlay with title, category, date, and a link to the event post
 *
 * variant="post"  — used on single event page
 *   slides: [{ url }]
 *   Pure image carousel, no overlay text
 */

export default function Carousel({
  slides = [],
  variant = "feed",
  autoPlay = true,
  interval = 5000,
  height = "h-80 md:h-96",
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: false },
    autoPlay ? [Autoplay({ delay: interval, stopOnInteraction: false })] : []
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
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

  if (!slides.length) return null

  return (
    <div className="relative w-full overflow-hidden group">

      {/* Viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={slide.id ?? slide.url ?? i}
              className={`relative flex-none w-full ${height}`}
            >
              {/* Image */}
              <img
                src={variant === "feed" ? slide.cover_image : slide.url}
                alt={variant === "feed" ? slide.title : `Image ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Feed overlay */}
              {variant === "feed" && (
                <Link
                  href={`/events/${slide.slug}`}
                  className="absolute inset-0 flex flex-col justify-end no-underline px-0 md:px-12"
                  style={{
                    background: "linear-gradient(to top, rgba(5,46,22,0.85) 0%, rgba(5,46,22,0.3) 50%, transparent 100%)",
                  }}
                >
                  <div className="p-6 md:py-8 md:p-0 max-w-6xl mx-auto w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary text-white">
                        {slide.category}
                      </span>
                      <span className="text-xs text-white/60">
                        {new Date(slide.date).toLocaleDateString("en-GB", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                      <h3 className="text-xl md:text-2xl font-bold text-white leading-snug flex-1">
                        {slide.title}
                      </h3>
                      <p className="text-sm flex items-center gap-1 text-white/70 mt-1">
                        Click to read more <ArrowRight size={16} />
                      </p>
                    </div>
                    
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prev button */}
      <button
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Next button */}
      <button
        onClick={scrollNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${i === selectedIndex
                ? "w-5 h-1.5 bg-white"
                : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

    </div>
  )
}