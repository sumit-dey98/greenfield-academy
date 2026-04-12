'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import Input from "@/components/ui/Input"
import {  LogIn, ArrowLeft } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, logout } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data: adminUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle()

      if (adminUser) {
        logout()  
        login({ ...adminUser, user_type: "admin" })
        router.push("/admin/dashboard")
        return
      }

      setError("No admin account found with this email address.")
    } catch (err) {
      console.error("Login error:", err)
      setError("Something went wrong. Please try again.")
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
            <h1 className="text-2xl font-bold text-text">Admin Portal</h1>
            <p className="text-sm text-muted mt-1">Greenfield Academy staff access.</p>
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
            placeholder="admin@greenfieldacademy.edu.bd"
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
            <div className="flex items-center gap-2 px-3 py-2.5 bg-surface border border-danger rounded-lg">
              <p className="text-xs text-danger">{error}</p>
            </div>
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
        {/* Back link */}
        <p className="text-center text-xs text-faint">
          <a href="/" className="font-medium text-primary no-underline hover:underline flex items-center gap-2 w-full justify-center">
            <ArrowLeft size={14} strokeWidth={2.5} /> Back to home
          </a>
        </p>

        <div className="bg-surface border border-surface-2 rounded-lg p-6">
          <em>There is no real authentication for this. Only check is to look for admin email in the db. Try: </em>
          <p><strong>Email: </strong>admin@greenfieldacademy.edu.bd</p>
          <strong>Password:</strong> admin123
        </div>
      </div>
    </div>
  )
}