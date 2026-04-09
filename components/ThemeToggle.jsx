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
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-transparent text-text text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-surface-2 leading-none"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Light" : "Dark"}
    </button>
  )
}