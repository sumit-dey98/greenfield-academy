'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Input from "@/components/ui/Input"
import { GraduationCap, LogIn, Shield } from "lucide-react"

export default function SuperAdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: sa, error: saError } = await supabase
      .from("superadmin")
      .select("id")
      .eq("id", data.user.id)
      .single()

    if (!sa || saError) {
      await supabase.auth.signOut()
      setError("You do not have superadmin access.")
      setLoading(false)
      return
    }

    router.push("/superadmin/dashboard")
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

        <p className="text-center text-xs text-faint">
          This portal is not for general use. Unauthorised access attempts are logged.
        </p>

      </div>
    </div>
  )
}