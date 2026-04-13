'use client'

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  CalendarDays,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import ClientOnly from "@/components/ClientOnly"

const navItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Results", href: "/student/results", icon: <ClipboardList size={18} /> },
  { label: "Attendance", href: "/student/attendance", icon: <CalendarCheck size={18} /> },
  { label: "Schedule", href: "/student/schedule", icon: <CalendarDays size={18} /> },
  { label: "Profile", href: "/student/profile", icon: <User size={18} /> },
]

export default function StudentLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push("/login?tab=student"); return }
    if (user.role !== "student") { router.push("/login?tab=student"); return }
  }, [user, loading])

  const handleLogout = () => {
    logout()
    router.push("/login?tab=student")
  }

  if (loading || !user) return null

  return (
    <div className="flex h-screen bg-bg overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-sidebar z-[300]
        flex flex-col transition-transform duration-300
        lg:static lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-border h-20 shadow-drop">
          <div className="w-10 h-10 rounded-md flex items-center justify-center">
            <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Greenfield</div>
            <div className="text-white/50 text-xs">Student Portal</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-white/50 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </Link>

        {/* User info */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full bg-surface-2 shrink-0"
          />
          <div className="overflow-hidden">
            <div className="text-white text-sm font-semibold truncate">{user.name}</div>
            <div className="text-white/50 text-xs">Roll: {user.roll}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150 no-underline
                  ${active
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white w-full transition-colors duration-150"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-surface border-b border-border px-6 h-20 flex items-center justify-between shrink-0 shadow-drop z-[100]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted hover:text-text"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-text">
                {navItems.find(i => i.href === pathname)?.label ?? "Dashboard"}
              </h1>
              <p className="text-xs text-muted">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            </div>
          </div>
          <ClientOnly >
            <ThemeToggle />
          </ClientOnly>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}