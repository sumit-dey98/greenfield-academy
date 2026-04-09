'use client'

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  Shield, LayoutDashboard, Users, BookOpen,
  Bell, Calendar, MessageSquare, Settings,
  LogOut, Menu, X, ChevronDown, User, CalendarDays, ClipboardList, CalendarCheck, GraduationCap
} from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"

const navItems = [
  {
    label: "Dashboard",
    href: "/superadmin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Academic",
    icon: <BookOpen size={18} />,
    children: [
      { label: "Students", href: "/superadmin/students", icon: <Users size={16} /> },
      { label: "Teachers", href: "/superadmin/teachers", icon: <User size={16} /> },
      { label: "Classes", href: "/superadmin/classes", icon: <BookOpen size={16} /> },
      { label: "Schedule", href: "/superadmin/schedule", icon: <CalendarDays size={16} /> },
      { label: "Results", href: "/superadmin/results", icon: <ClipboardList size={16} /> },
      { label: "Attendance", href: "/superadmin/attendance", icon: <CalendarCheck size={16} /> },
      { label: "Exams", href: "/superadmin/exams", icon: <GraduationCap size={16} /> },
    ],
  },
  {
    label: "Content",
    icon: <Bell size={18} />,
    children: [
      { label: "Notices", href: "/superadmin/notices", icon: <Bell size={16} /> },
      { label: "Events", href: "/superadmin/events", icon: <Calendar size={16} /> },
      { label: "Testimonials", href: "/superadmin/testimonials", icon: <MessageSquare size={16} /> },
    ],
  },
  {
    label: "Settings",
    href: "/superadmin/settings",
    icon: <Settings size={18} />,
  },
  {
    label: "Users",
    href: "/superadmin/users",
    icon: <Shield size={18} />,
  },
]

function NavGroup({ item, pathname, setSidebarOpen }) {
  const isChildActive = item.children?.some(c => pathname === c.href)
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left
          text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors duration-150"
      >
        {item.icon}
        <span className="flex-1">{item.label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
          {item.children.map(child => {
            const active = pathname === child.href
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium no-underline
                  transition-colors duration-150
                  ${active
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                  }`}
              >
                {child.icon}
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SuperAdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (pathname === "/superadmin/login") {
      setChecking(false)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        router.push("/superadmin/login")
        return
      }

      const { data: sa } = await supabase
        .from("superadmin")
        .select("id, email, name")
        .eq("id", session.user.id)
        .single()

      if (!sa) {
        await supabase.auth.signOut()
        router.push("/superadmin/login")
        return
      }

      setUser(sa)
      setChecking(false)
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/superadmin/login")
  }

  const currentLabel = navItems
    .flatMap(i => i.children ?? [i])
    .find(i => i.href === pathname)?.label ?? "Dashboard"

  if (pathname === "/superadmin/login") {
    return <>{children}</>
  }

  if (checking) return null

  return (
    <div className="flex h-screen bg-bg overflow-hidden">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-sidebar z-30
        flex flex-col transition-transform duration-300
        lg:static lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-md flex items-center justify-center">
            <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Greenfield</div>
            <div className="text-white/50 text-xs">Superadmin Panel</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-white/50 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Shield size={16} color="#fff" />
          </div>
          <div className="overflow-hidden">
            <div className="text-white text-sm font-semibold truncate">{user?.name}</div>
            <div className="text-white/50 text-xs">Superadmin</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item, i) =>
            item.children ? (
              <NavGroup key={i} item={item} pathname={pathname} setSidebarOpen={setSidebarOpen} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline
                  transition-colors duration-150
                  ${pathname === item.href
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                  }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-white w-full transition-colors duration-150"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-surface border-b border-border px-6 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted hover:text-text">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-text">{currentLabel}</h1>
              <p className="text-xs text-muted">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}