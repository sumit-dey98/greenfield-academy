'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function SuperadminRoot() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (user?.role === "super_admin") {
      router.replace("/superadmin/dashboard")
    } else {
      router.replace("/superadmin/login")
    }
  }, [user, loading])

  return null
}
