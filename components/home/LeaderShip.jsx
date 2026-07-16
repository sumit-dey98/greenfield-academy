'use client'

import { useEffect, useState } from "react"
import { getFaculty } from "@/lib/api/public"
import { Users, Quote } from "lucide-react"
import Reveal from "@/components/ui/Reveal"

export default function Leadership({
  title = "Message from our administration",
  roles = ["Chairman", "Principal", "Vice Principal"],
  bio = false,
  message = true,
  onReady,
}) {
  const [leadership, setLeadership] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const all = (await getFaculty()) ?? []
        const sorted = all
          .filter(t => roles.includes(t.role))
          .sort((a, b) => roles.indexOf(a.role) - roles.indexOf(b.role))
        setLeadership(sorted)
      } catch (err) {
        console.error("Failed to load leadership:", err)
      }
    }
    load()
    onReady?.()
  }, [roles.join(",")])

  if (leadership.length === 0) return null

  return (
    <section className="py-10 md:py-20 px-6 md:px-12 bg-surface border-t border-surface-2">
      <div className="max-w-6xl mx-auto">

        <Reveal className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
            <Users size={13} />
            Leadership
          </div>
          <h2 className="text-3xl font-bold text-text">{title}</h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {leadership.map((l, i) => (
            <Reveal key={l.id} delay={i * 0.1} className="card flex flex-col items-start text-left gap-4">

              {/* Avatar */}
              <div className="relative w-full">
                <img
                  src={l.avatar}
                  alt={l.name}
                  className="w-full h-56 rounded-lg object-cover bg-surface-2"
                />
                {message &&
                  <div className="absolute -bottom-3 -right-3 w-9 h-9 rounded-full bg-accent shadow-hover flex items-center justify-center">
                    <Quote size={15} fill="#fff" stroke="none" />
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
                <div className="relative border-t border-border pt-4 w-full">
                  <Quote size={18} className="text-primary mb-2" />
                  <p className="text-sm text-muted leading-relaxed italic tracking-wide">
                    {l.message}
                  </p>
                </div>
              )}

            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}