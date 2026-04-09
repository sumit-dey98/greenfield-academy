'use client'

import { useEffect, useState } from "react"
import { ChevronUp } from "lucide-react"

export default function ScrollTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-text hover:text-bg transition-all duration-200"
    >
      <ChevronUp size={18} />
    </button>
  )
}