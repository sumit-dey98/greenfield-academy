'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import Input from "@/components/ui/Input"
import { LogIn, AlertTriangle } from "lucide-react"

export default function SuperAdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, logout } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const account = await login(email, password)

      if (account.role !== "super_admin") {
        logout()
        setError("You do not have superadmin access.")
        return
      }

      router.push("/superadmin/dashboard")
    } catch (err) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 hover:brightness-90 transition-all">
            <div className="w-20 20 rounded-md flex items-center justify-center text-white shrink-0">
              <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
            </div>
            {/* <span className="text-3xl font-bold text-text text-left leading-tight">
              Greenfield<span className="text-primary block">Academy</span>
            </span> */}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">Superadmin</h1>
            <p className="text-sm text-muted mt-1">Restricted access. Real authorization applies here</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} noValidate className="card flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            disabled={loading}
          />
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-danger font-medium"><AlertTriangle size={15} />{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center h-11 disabled:opacity-60"
          >
            {loading
              ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              : <><LogIn size={15} /> Sign In</>
            }
          </button>
        </form>

        <p className="text-center text-xs text-faint">
          This portal is not for general use. Unauthorised access attempts are logged.
        </p>

      </div>
    </div>
  )
}