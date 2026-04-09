'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function SuperadminRoot() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/superadmin/dashboard")
      } else {
        router.push("/superadmin/login")
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return null
}