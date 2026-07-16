'use client'

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    try {
      const theme = localStorage.getItem("theme")
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
        setIsDark(true)
      } else {
        document.documentElement.classList.remove("dark")
        setIsDark(false)
      }
    } catch (e) { }
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    if (html.classList.contains("dark")) {
      html.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDark(false)
    } else {
      html.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDark(true)
    }
  }

  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center w-16 h-8 lg:w-20 lg:h-10 rounded-sm border transition-colors duration-200 cursor-pointer shrink-0 shadow-sm
        ${isDark ? "bg-primary border-primary" : "bg-surface-2"}`}
    >
      <span
        className={`absolute top-[1px] flex items-center justify-center w-7 h-7 lg:w-9 lg:h-9 rounded-sm bg-surface shadow-drop
          transition-transform duration-200 ease-out
          ${isDark ? "translate-x-8 lg:translate-x-[41px]" : "translate-x-0.5"}`}
      >
        {isDark ? <Moon size={16} className="text-primary lg:w-6 lg:h-6" /> : <Sun size={16} className="text-warning lg:w-6 lg:h-6" />}
      </span>
    </button>
  )
}