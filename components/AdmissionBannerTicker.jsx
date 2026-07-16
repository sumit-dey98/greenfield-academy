'use client'

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { GraduationCap, ArrowRight, CircleSmall } from "lucide-react"

export default function AdmissionBannerTicker({ academicYear }) {
  const containerRef = useRef(null)
  const messageRef = useRef(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const check = () => {
      if (!containerRef.current || !messageRef.current) return
      setOverflowing(messageRef.current.scrollWidth > containerRef.current.clientWidth)
    }
    check()
    const observer = new ResizeObserver(check)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const message = (
    <span ref={messageRef} className="flex items-center gap-2 shrink-0 px-4">
      <CircleSmall size={20} className="shrink-0 animate-pulse fill-text text-text" />
      <span>
        Admissions are open{academicYear ? ` for the ${academicYear} academic year` : ""} for all classes.
      </span>
      <span className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
        Apply Here <ArrowRight size={13} />
      </span>
    </span>
  )

  return (
    <Link
      ref={containerRef}
      href="/admission"
      className="block bg-primary text-white text-sm font-medium no-underline hover:bg-primary-hover transition-colors duration-150 overflow-x-hidden"
    >
      {overflowing ? (
        <span className="marquee-track flex items-center whitespace-nowrap w-max py-2.5">
          {message}
          {message}
        </span>
      ) : (
        <span className="flex items-center justify-center whitespace-nowrap py-2.5">
          {message}
        </span>
      )}
    </Link>
  )
}
