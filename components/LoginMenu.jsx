'use client'

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { LogIn, ChevronDown, LayoutDashboard, User, LogOut } from "lucide-react"

// admin/super_admin have no self-service profile page — Profile is hidden for those types.
const DASHBOARD_HREF = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/superadmin/dashboard",
}
const PROFILE_HREF = { student: "/student/profile", teacher: "/teacher/profile" }
const ROLE_LABEL = { student: "Student", teacher: "Teacher", admin: "Admin", super_admin: "Super Admin" }

function initials(name) {
  return name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

// variant="popover" (default): compact chip + floating dropdown, for the desktop navbar.
// variant="inline": full-width trigger + panel flows in place, for the mobile sidebar.
export default function LoginMenu({ onNavigate, variant = "popover" }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const inline = variant === "inline"

  useEffect(() => {
    if (!open || inline) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, inline])

  if (!user) {
    return (
      <Link
        href="/login"
        onClick={() => onNavigate?.()}
        className={`flex items-center gap-1.5 rounded-sm text-sm font-semibold no-underline
          bg-primary text-white hover:bg-primary/90 transition-colors duration-150
          ${inline ? "px-4 py-2.5 justify-center" : "px-4 py-1.5"}`}
      >
        <LogIn size={15} />
        Login
      </Link>
    )
  }

  const dashboardHref = DASHBOARD_HREF[user.user_type] ?? "/"
  const profileHref = PROFILE_HREF[user.user_type] // undefined for admin/super_admin — no such page
  const roleLabel = ROLE_LABEL[user.user_type] ?? user.user_type

  const handleSignOut = () => {
    setOpen(false)
    onNavigate?.()
    logout()
    router.push("/")
  }

  const panel = (
    <>
      {/* Identity header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface-2">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-primary">
            {initials(user.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text truncate">{user.name}</p>
          <p className="text-xs text-faint">{roleLabel}</p>
        </div>
      </div>

      <div >
        <Link
          href={dashboardHref}
          onClick={() => { setOpen(false); onNavigate?.() }}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium no-underline text-text hover:bg-surface-2 transition-colors duration-150"
        >
          <LayoutDashboard size={15} className="text-primary" />
          Dashboard
        </Link>
        {profileHref && (
          <Link
            href={profileHref}
            onClick={() => { setOpen(false); onNavigate?.() }}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium no-underline text-text hover:bg-surface-2 transition-colors duration-150"
          >
            <User size={15} className="text-primary" />
            Profile
          </Link>
        )}
      </div>

      <div className="border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-danger hover:bg-surface-2 transition-colors duration-150 cursor-pointer"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </>
  )

  if (inline) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2.5 pl-2 pr-3 py-2 rounded-lg border border-border bg-surface
            hover:bg-surface-2 transition-colors duration-150 cursor-pointer w-full"
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-primary">
              {initials(user.name)}
            </div>
          )}
          <span className="text-sm font-medium text-text truncate flex-1 text-left">{user.name}</span>
          <ChevronDown size={14} className={`text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            {panel}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-sm border border-border bg-surface
          hover:bg-surface-2 transition-colors duration-150 cursor-pointer"
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-primary">
            {initials(user.name)}
          </div>
        )}
        <span className="text-sm font-medium text-text max-w-28 truncate hidden sm:block">{user.name}</span>
        <ChevronDown size={14} className={`text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-56 bg-surface border border-border rounded-sm shadow-drop overflow-hidden z-50">
          {panel}
        </div>
      )}
    </div>
  )
}
