'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Users, Quote } from "lucide-react"

export default function Leadership({
  title = "Message from our administration",
  roles = ["Chairman", "Principal", "Vice Principal"],
  bio = false,
  message = true,
  onReady,
}) {
  const [leadership, setLeadership] = useState([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("teachers")
        .select("id, name, role, avatar, join_date, bio, message")
        .in("role", roles)

      if (data) {
        const sorted = [...data].sort(
          (a, b) => roles.indexOf(a.role) - roles.indexOf(b.role)
        )
        setLeadership(sorted)
      }
    }
    fetch()
    onReady?.()
  }, [roles.join(",")])

  if (leadership.length === 0) return null

  return (
    <section className="py-10 md:py-20 px-6 md:px-12 bg-surface border-t border-surface-2">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
            <Users size={13} />
            Leadership
          </div>
          <h2 className="text-3xl font-bold text-text">{title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {leadership.map(l => (
            <div key={l.id} className="flex flex-col items-start text-left gap-4">

              {/* Avatar */}
              <div className="relative">
                <img
                  src={l.avatar}
                  alt={l.name}
                  className="w-52 h-52 rounded-lg object-cover bg-surface-2 ring-2 ring-primary"
                />
                {message && 
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Quote size={14} fill="#fff" stroke="none" />
                  </div>
                }
              </div>

              {/* Name + role */}
              <div>
                <h3 className="text-xl font-bold text-text">{l.name}</h3>
                <p className="text-base text-primary font-semibold mt-0.5">{l.role}</p>
                {l.join_date && (
                  <p className="text-xs text-faint mt-0.5">
                    Since {new Date(l.join_date).getFullYear()}
                  </p>
                )}
              </div>

              {/* Bio */}
              {bio && l.bio && (
                <p className="text-sm text-muted leading-relaxed">
                  {l.bio}
                </p>
              )}

              {/* Message */}
              {message && l.message && (
                <div className="relative">
                  <Quote size={20} className="text-text rotate-180 mb-2" />
                  <p className="text-sm text-muted leading-relaxed italic tracking-wide">
                    {l.message}
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </section>
  )
}