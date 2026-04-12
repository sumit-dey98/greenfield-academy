'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  GraduationCap, Menu, X, ChevronDown,
  LayoutDashboard, GraduationCap as StudentIcon, BookOpen,
} from "lucide-react"
import ThemeToggle from "./ThemeToggle"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Events", href: "/events" },
  { label: "Notices", href: "/notices" },
  { label: "Admission", href: "/admission" },
]

const dashboardLinks = [
  { label: "Student Portal", href: "/student/dashboard", icon: <StudentIcon size={15} /> },
  { label: "Teacher Portal", href: "/teacher/dashboard", icon: <BookOpen size={15} /> },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const pathname = usePathname()

  const isDashboardActive = dashboardLinks.some(l => pathname.startsWith(l.href.split("/").slice(0, 2).join("/")))

  return (
    <nav className="sticky top-0 z-[200] bg-surface border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-6 py-4 md:h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-10 h-10 rounded-md flex items-center justify-center">
            <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
          </div>
          <span className="font-bold text-lg text-text hidden sm:block">
            Greenfield <span className="text-primary">Academy</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-base font-medium no-underline transition-all duration-200 ${pathname === link.href
                  ? "text-primary"
                  : "text-muted bg-transparent hover:bg-surface-2"
                }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Dashboard dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-base font-medium transition-all duration-200 cursor-pointer ${isDashboardActive
                  ? "text-primary"
                  : "text-muted hover:bg-surface-2"
                }`}
            >
              <LayoutDashboard size={15} />
              Portals
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-52 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {dashboardLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDropdownOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-3 text-sm font-medium no-underline transition-colors duration-150 border-b border-border last:border-0 ${pathname.startsWith("/" + link.href.split("/")[1])
                        ? "text-primary bg-primary-light"
                        : "text-text hover:bg-surface-2"
                      }`}
                  >
                    <span className="text-primary">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md border border-border bg-transparent text-text hover:bg-surface-2 transition-all duration-200 flex md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <>
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Panel */}
        <div
          className={`fixed top-0 right-0 h-full w-72 bg-surface z-50 flex flex-col shadow-lg transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md flex items-center justify-center">
                <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
              </div>
              <span className="font-bold text-sm text-text">
                Greenfield <span className="text-primary">Academy</span>
              </span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors duration-150 ${pathname === link.href
                    ? "text-primary bg-primary-light"
                    : "text-muted hover:bg-surface-2 hover:text-text"
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Portals section */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-semibold text-faint uppercase tracking-wide px-3 mb-2">
                Portals
              </p>
              {dashboardLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors duration-150 ${pathname.startsWith("/" + link.href.split("/")[1])
                      ? "text-primary bg-primary-light"
                      : "text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                >
                  <span className="text-primary">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Sidebar footer */}
          <div className="px-5 py-4 border-t border-border">
            <ThemeToggle />
          </div>
        </div>
      </>
    </nav>
  )
}