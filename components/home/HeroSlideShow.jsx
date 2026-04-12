"use client"

import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop",
    alt: "Classroom",
    caption: "Well-organized classrooms",
  },
  {
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop",
    alt: "Engaging method of teaching",
    caption: "Engaging method of teaching",

  },
  {
    src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop",
    alt: "Extracurricular",
    caption: "Frequent extracurricular activities",
  },
  {
    src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop",
    alt: "Library",
    caption: "A well-equipped library",
  },
]

export default function HeroSlideshow({ className, homeClasses }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ])

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <div className="relative w-full h-64 sm:h-80 lg:h-full min-h-[360px]">
      <div ref={emblaRef} className="overflow-hidden h-full">
        <div className="flex h-full">
          {SLIDES.map((slide, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0 h-full relative">
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-primary px-4 py-2.5">
                <p className="text-bg text-sm font-semibold text-center">{slide.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className="w-1.5 h-1.5 rounded-full bg-white/60 hover:bg-white transition-colors"
          />
        ))}
      </div>
    </div>
  )
}