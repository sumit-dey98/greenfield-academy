'use client'

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { requestPasswordReset } from "@/lib/api/resetRequests"
import Link from "next/link"
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react"
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
    email: "fatema@greenfieldacademy.edu.bd",
    password: "password123",
    dashboard: "/teacher/dashboard",
    activeClass: "border-primary bg-text text-bg",
  },
]

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, setPassword: setAccountPassword } = useAuth()

  const tabParam = searchParams.get("tab")
  const [activeRole, setActiveRole] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // "login" = normal sign-in; "set" = first-time password setup (account has no password yet)
  const [mode, setMode] = useState("login")
  const [requestingReset, setRequestingReset] = useState(false)
  const [resetMsg, setResetMsg] = useState(null) // { type: "success" | "error", text }

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
    setConfirmPassword("")
    setMode("login")
    setResetMsg(null)
  }, [tabParam])

  const routeByType = (account) => {
    if (account.user_type === "student") { router.push("/student/dashboard"); return true }
    if (account.user_type === "teacher") { router.push("/teacher/dashboard"); return true }
    setError("This is a staff account. Please use the admin portal to sign in.")
    return false
  }

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
      const account = await login(email, password)
      routeByType(account)
    } catch (err) {
      if (err?.error_code === "PASSWORD_NOT_SET") {
        // Account exists but has no password yet — switch to first-time setup.
        setMode("set")
        setPassword("")
        setConfirmPassword("")
        setError("")
        return
      }
      console.error("Login error:", err)
      setError(
        err?.error_code === "INVALID_CREDENTIALS"
          ? "Invalid email or password."
          : "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReset = async () => {
    setResetMsg(null)
    setError("")
    if (!activeRole) { setError("Select Student or Teacher first."); return }
    if (!email.trim()) { setError("Enter your email, then request a reset."); return }

    setRequestingReset(true)
    try {
      await requestPasswordReset(activeRole, email)
      setResetMsg({
        type: "success",
        text: "Reset request sent. Once an admin approves it, sign in with your email to set a new password.",
      })
    } catch (err) {
      setResetMsg({
        type: "error",
        text:
          err?.error_code === "RESET_REQUEST_EXISTS"
            ? "You already have a pending reset request. Please wait for an admin."
            : err?.error_code?.endsWith("_NOT_FOUND")
              ? "No account found with this email for the selected role."
              : "Could not send the request. Please try again.",
      })
    } finally {
      setRequestingReset(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setError("")

    const pwdError = validatePassword(password)
    if (pwdError) { setError(pwdError); return }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const account = await setAccountPassword(email, password)
      routeByType(account)
    } catch (err) {
      console.error("Set-password error:", err)
      setError(
        err?.error_code === "PASSWORD_ALREADY_SET"
          ? "This account already has a password. Try signing in, or ask an admin to reset it."
          : err?.error_code === "USER_NOT_FOUND"
            ? "No account found with this email."
            : "Something went wrong. Please try again."
      )
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
              <h1 className="mb-1.5 text-2xl font-bold text-text">
                {mode === "set" ? "Create your password" : "Sign in to your portal"}
              </h1>
              <p className="text-sm text-muted">
                {mode === "set"
                  ? "Your account has no password yet. Set one to continue."
                  : "Select your role to continue."}
              </p>
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
                {/* {activeHint && (
                  <div className="relative flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2.5 text-xs text-muted">
                    <span>
                      Sample email for{" "}
                      <strong className="font-semibold text-text">{activeHint.label}</strong>:
                    </span>
                    <code className="ml-auto rounded bg-primary-light px-2 py-0.5 font-mono text-xs text-primary truncate max-w-[55%]">
                      {activeHint.email}
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
                          Sign in with your <strong className="text-text font-semibold">portal credentials</strong>.
                          Authentication is handled by the backend — enter the account's email and password
                          (min 8 characters, with letters &amp; numbers).
                        </p>
                        <div className="absolute -bottom-1.5 right-2 w-2.5 h-2.5 rotate-45 border-b border-r border-border bg-surface" />
                      </div>
                    </div>
                  </div>
                )} */}
        
                <form onSubmit={mode === "set" ? handleSetPassword : handleLogin} noValidate className="card flex flex-col gap-4">
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
                        readOnly={mode === "set"}
                        className={`input pl-9 ${mode === "set" ? "opacity-70 cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-password" className="text-xs font-semibold text-text">
                      {mode === "set" ? "New password" : "Password"}
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={14} className="pointer-events-none absolute left-3 text-faint" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder={mode === "set" ? "Create a password" : "Enter your password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === "set" ? "new-password" : "current-password"}
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
                    {mode === "set" && (
                      <p className="text-xs text-faint">At least 8 characters, with letters and numbers.</p>
                    )}
                  </div>

                  {mode === "set" && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login-confirm" className="text-xs font-semibold text-text">
                        Confirm password
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={14} className="pointer-events-none absolute left-3 text-faint" />
                        <input
                          id="login-confirm"
                          type={showPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                          className="input pl-9 appearance-none"
                        />
                      </div>
                    </div>
                  )}

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
                    ) : mode === "set" ? (
                      <>Set Password &amp; Continue <ArrowRight size={14} strokeWidth={2.5} /></>
                    ) : (
                      <>Sign In <ArrowRight size={14} strokeWidth={2.5} /></>
                    )}
                  </button>

                  {mode === "set" && (
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); setPassword(""); setConfirmPassword("") }}
                      className="text-xs font-medium text-muted hover:text-text transition-colors"
                    >
                      Back to sign in
                    </button>
                  )}

                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={handleRequestReset}
                      disabled={requestingReset}
                      className="text-xs font-medium text-primary hover:underline transition-colors disabled:opacity-60"
                    >
                      {requestingReset ? "Sending request..." : "Forgot password? Request a reset"}
                    </button>
                  )}

                  {resetMsg && (
                    <div
                      className={`flex items-start gap-2 rounded-md px-3.5 py-2.5 text-xs font-medium ${
                        resetMsg.type === "success"
                          ? "border border-success bg-primary-light text-success"
                          : "border border-danger bg-red-50 dark:bg-red-950/30 text-danger"
                      }`}
                    >
                      <AlertCircle size={14} className="shrink-0 mt-px" />
                      {resetMsg.text}
                    </div>
                  )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}