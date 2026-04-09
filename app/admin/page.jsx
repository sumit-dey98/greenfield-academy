'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function AdminIndex() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (user?.user_type === "admin") {
      router.replace("/admin/dashboard")
    } else {
      router.replace("/admin/login")
    }
  }, [user, loading])

  return null
}