'use client'

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { login as apiLogin, setPassword as apiSetPassword, getMe, fetchProfile, logout as apiLogout } from "@/lib/api/auth"
import { hasTokens, clearTokens } from "@/lib/api/tokens"

const AuthContext = createContext(null)

// Cached identity+profile for instant paint; revalidated against /auth/me on load.
const USER_CACHE_KEY = "gfa_user"

const PERMISSIONS = {
  super_admin: { cms: true, academic: true, users: true },
  admin: { cms: true, academic: true, users: false },
  editor: { cms: true, academic: false, users: false },
  mock_admin: { cms: false, academic: false, users: false },
  mock_editor: { cms: false, academic: false, users: false },
}

function readCachedUser() {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(USER_CACHE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser)
  // If tokens exist we must revalidate before trusting the cached user -> start in loading.
  const [loading, setLoading] = useState(() => typeof window !== "undefined" && hasTokens())
  const [writeBlocked, setWriteBlocked] = useState(false)

  const persistUser = useCallback((u) => {
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u))
      else localStorage.removeItem(USER_CACHE_KEY)
    }
    setUser(u)
  }, [])

  // Build the full user object from identity (/auth/me) + display profile.
  const buildUser = useCallback(async () => {
    const me = await getMe() // { id, user_type, role }
    const profile = await fetchProfile(me.user_type, me.id)
    // Identity (user_type/role/id) always wins over profile fields
    // (e.g. TeacherOut.role is a job title, not the permission role).
    return { ...profile, id: me.id, user_type: me.user_type, role: me.role }
  }, [])

  // On mount: if we have tokens, confirm the session and refresh the user.
  useEffect(() => {
    let cancelled = false
    const hydrate = async () => {
      if (!hasTokens()) {
        persistUser(null)
        setLoading(false)
        return
      }
      try {
        const u = await buildUser()
        if (!cancelled) persistUser(u)
      } catch {
        clearTokens()
        if (!cancelled) persistUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    hydrate()
    return () => { cancelled = true }
  }, [buildUser, persistUser])

  // The api client fires this when a token is unrecoverable (bad/expired refresh, wrong type).
  useEffect(() => {
    const onExpired = () => persistUser(null)
    window.addEventListener("gfa:auth-expired", onExpired)
    return () => window.removeEventListener("gfa:auth-expired", onExpired)
  }, [persistUser])

  // Real login: POST /auth/login, then load identity + profile. Returns the user
  // so callers can route by user_type/role.
  const login = async (email, password) => {
    await apiLogin(email, password)
    const u = await buildUser()
    persistUser(u)
    return u
  }

  // First-time password set for a null-password account, then log in.
  const setPassword = async (email, newPassword) => {
    await apiSetPassword(email, newPassword)
    const u = await buildUser()
    persistUser(u)
    return u
  }

  const logout = () => {
    apiLogout()
    persistUser(null)
  }

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates }
      if (typeof window !== "undefined") localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const isSuperAdmin = user?.role === "super_admin"

  const can = (action) => {
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
      user, loading, login, setPassword, logout, updateUser,
      can, attemptWrite, writeBlocked, clearWriteBlocked,
      isSuperAdmin, superAdminName: user?.name ?? null,
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
