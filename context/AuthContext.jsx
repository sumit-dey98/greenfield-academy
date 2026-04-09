'use client'

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const AuthContext = createContext(null)

const PERMISSIONS = {
  super_admin: { cms: true, academic: true, users: true },
  admin: { cms: true, academic: true, users: false },
  editor: { cms: true, academic: false, users: false },
  mock_admin: { cms: false, academic: false, users: false },
  mock_editor: { cms: false, academic: false, users: false },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem("user")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [writeBlocked, setWriteBlocked] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [superAdminName, setSuperAdminName] = useState(null)

  const fetchSuperAdminName = async (uid) => {
    const { data } = await supabase
      .from("superadmin")
      .select("name")
      .eq("id", uid)
      .single()
    setSuperAdminName(data?.name ?? "Super Admin")
  }

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsSuperAdmin(true)
        await fetchSuperAdminName(session.user.id)
      }
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsSuperAdmin(true)
        await fetchSuperAdminName(session.user.id)
      } else {
        setIsSuperAdmin(false)
        setSuperAdminName(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
  }

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    localStorage.setItem("user", JSON.stringify(updated))
    setUser(updated)
  }

  const can = (action) => {
    if (isSuperAdmin) return true
    if (!user?.role) return false
    return PERMISSIONS[user.role]?.[action] ?? false
  }

  const attemptWrite = (action = "cms") => {
    if (!can(action)) {
      setWriteBlocked(true)
      return false
    }
    return true
  }

  const clearWriteBlocked = () => setWriteBlocked(false)

  useEffect(() => {
    if (!writeBlocked) return
    const t = setTimeout(clearWriteBlocked, 3000)
    return () => clearTimeout(t)
  }, [writeBlocked])

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, updateUser,
      can, attemptWrite, writeBlocked, clearWriteBlocked,
      isSuperAdmin, superAdminName,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}