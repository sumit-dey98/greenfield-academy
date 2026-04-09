'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import ThemeToggle from "@/components/ThemeToggle"

const ROLE_HINTS = [
  {
    role: "student",
    label: "Student",
    email: "rahim@student.greenfieldacademy.edu.bd",
    password: "student123",
    dashboard: "/student/dashboard",
    activeClass: "border-primary bg-text text-bg",
  },
  {
    role: "teacher",
    label: "Teacher",
    email: "rafiqul@greenfieldacademy.edu.bd",
    password: "teacher123",
    dashboard: "/teacher/dashboard",
    activeClass: "border-primary bg-text text-bg",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const tabParam = searchParams.get("tab")
  const [activeRole, setActiveRole] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Set tab from URL param on mount / param change
  useEffect(() => {
    const match = ROLE_HINTS.find(h => h.role === tabParam)
    if (match) {
      setActiveRole(match.role)
      setEmail(match.email)
    } else {
      setActiveRole(null)
      setEmail("")
    }
    setError("")
    setPassword("")
  }, [tabParam])

  const handleRoleSelect = (hint) => {
    router.push(`/login?tab=${hint.role}`)
  }

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters."
    if (!/[a-zA-Z]/.test(pwd)) return "Password must contain at least one letter."
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number."
    return null
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")

    if (!activeRole) {
      setError("Please select Student or Teacher before signing in.")
      return
    }

    const pwdError = validatePassword(password)
    if (pwdError) { setError(pwdError); return }

    setLoading(true)

    try {
      if (activeRole === "student") {
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("email", email.trim().toLowerCase())
          .maybeSingle()

        if (student) {
          login({ ...student, user_type: "student" })
          router.push("/student/dashboard")
          return
        }
        setError("No student account found with this email.")
        return
      }

      if (activeRole === "teacher") {
        const { data: teacher } = await supabase
          .from("teachers")
          .select("*")
          .eq("email", email.trim().toLowerCase())
          .maybeSingle()

        if (teacher) {
          login({ ...teacher, user_type: "teacher" })
          router.push("/teacher/dashboard")
          return
        }
        setError("No teacher account found with this email.")
        return
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const activeHint = ROLE_HINTS.find(h => h.role === activeRole)

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-bg">

      {/* Dot-grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between px-6 h-16 border-b border-border bg-surface">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-md flex items-center justify-center">
            <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
          </div>
          <span className="text-base font-bold text-text hidden sm:block">
            Greenfield <span className="text-primary">Academy</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main split */}
      <main className="relative z-[1] flex-1 grid grid-cols-1 lg:grid-cols-[0.5fr_1fr]">

        {/* Left brand panel */}
        <aside className="hidden lg:flex items-center justify-center bg-sidebar px-14 py-16 relative overflow-hidden">
          <div className="pointer-events-none absolute w-72 h-72 rounded-full bg-white/5 -top-16 -right-20" />
          <div className="pointer-events-none absolute w-44 h-44 rounded-full bg-white/5 bottom-10 -left-12" />
          <div className="relative z-[1] flex flex-col gap-7">
            <blockquote className="text-lg leading-relaxed font-light italic text-sidebar-text">
              "Education is the most powerful weapon you can use to change the world."
            </blockquote>
            <p className="text-xs font-medium uppercase tracking-widest text-sidebar-text opacity-50">
              — Nelson Mandela
            </p>
            <div className="flex items-center gap-5 mt-1 pt-5 border-t border-white/10">
              {[
                { value: "1,200+", label: "Students" },
                { value: "30+", label: "Teachers" },
                { value: "98%", label: "GPA-5 in SSC 2024" },
              ].map((stat, i, arr) => (
                <div key={stat.label} className="flex items-center gap-5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xl font-bold leading-none text-white">{stat.value}</span>
                    <span className="text-xs font-medium uppercase tracking-widest text-sidebar-text opacity-50">{stat.label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="h-8 w-px shrink-0 bg-white/10" />}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right form section */}
        <section className="flex items-center justify-center px-6 md:px-12 py-10 bg-bg">
          <div className="flex w-full max-w-sm flex-col gap-5">

            <div className="mb-1">
              <h1 className="mb-1.5 text-2xl font-bold text-text">Sign in to your portal</h1>
              <p className="text-sm text-muted">Select your role to continue.</p>
            </div>

            {/* Tab selector */}
            <div className="flex gap-2">
              {ROLE_HINTS.map((hint) => {
                const isActive = activeRole === hint.role
                return (
                  <button
                    key={hint.role}
                    type="button"
                    onClick={() => handleRoleSelect(hint)}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-150 ${isActive
                        ? hint.activeClass
                        : "border-border bg-surface text-muted hover:bg-surface-2 hover:text-text"
                      }`}
                  >
                    {hint.label}
                  </button>
                )
              })}
            </div>

            {/* No tab selected state */}
            {!activeRole && (
              <div className="card flex flex-col items-center gap-3 py-8 text-center">
                <GraduationCap size={32} className="text-faint" />
                <p className="text-sm text-muted">Select <strong className="text-text">Student</strong> or <strong className="text-text">Teacher</strong> above to continue.</p>
              </div>
            )}

            {/* Form — only shown when tab selected */}
            {activeRole && (
              <>
                {/* Demo hint */}
                {activeHint && (
                  <div className="relative flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2.5 text-xs text-muted">
                    <span>
                      Demo credentials for{" "}
                      <strong className="font-semibold text-text">{activeHint.label}</strong>:
                    </span>
                    <code className="ml-auto rounded bg-primary-light px-2 py-0.5 font-mono text-xs text-primary">
                      {activeHint.password}
                    </code>
                    <div className="relative group">
                      <button
                        type="button"
                        className="w-4 h-4 rounded-full border border-border text-faint hover:text-muted hover:border-muted flex items-center justify-center text-[10px] font-bold leading-none transition-colors"
                      >
                        ?
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 w-64 rounded-md border border-border bg-surface shadow-lg px-3 py-2.5 text-xs text-muted leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50">
                        <p>
                          This is a <strong className="text-text font-semibold">demo login</strong> — no real authentication.
                          Enter any email that exists in the database. The password only needs to pass a basic format check (8+ chars, letters & numbers).
                        </p>
                        <div className="absolute -bottom-1.5 right-2 w-2.5 h-2.5 rotate-45 border-b border-r border-border bg-surface" />
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLogin} noValidate className="card flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-email" className="text-xs font-semibold text-text">
                      Email address
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={14} className="pointer-events-none absolute left-3 text-faint" />
                      <input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className="input pl-9"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-password" className="text-xs font-semibold text-text">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={14} className="pointer-events-none absolute left-3 text-faint" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="input pl-9 pr-10 appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 flex cursor-pointer items-center border-none bg-transparent p-0 text-faint transition-colors hover:text-muted"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div role="alert" className="flex items-center gap-2 rounded-md border border-danger bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs font-medium text-danger">
                      <AlertCircle size={14} className="shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full justify-center mt-1 h-11 text-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    {loading ? (
                      <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>Sign In <ArrowRight size={14} strokeWidth={2.5} /></>
                    )}
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-xs text-faint">
              <a href="/" className="font-medium text-primary no-underline hover:underline flex items-center gap-2 w-full justify-center">
                <ArrowLeft size={14} strokeWidth={2.5} /> Back to home
              </a>
            </p>

          </div>
        </section>
      </main>
    </div>
  )
}