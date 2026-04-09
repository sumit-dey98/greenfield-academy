'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { CalendarDays, Clock } from "lucide-react"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]

const DAY_COLORS = ["#059669", "#0891b2", "#9333ea", "#f59e0b", "#ef4444"]

export default function TeacherSchedule() {
  const { user, setUser } = useAuth()
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(null)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase
        .from("schedule")
        .select("*, subjects(name, code), classes(name)")
        .eq("teacher_id", user.id)
        .order("start_time", { ascending: true })
      if (data) setSchedule(data)
      setLoading(false)
    }
    fetch()
  }, [user])

  useEffect(() => {
    const todayIndex = new Date().getDay()
    const today = DAYS[todayIndex]
    setActiveDay(DAYS.includes(today) ? today : DAYS[0])
  }, [])

  const today = DAYS[new Date().getDay()]
  const filtered = schedule.filter(s => s.day === activeDay)
  const totalClasses = schedule.length
  const todayCount = schedule.filter(s => s.day === today).length

  const stats = [
    { label: "Total Classes / Week", value: totalClasses, text: "text-text", bg: "bg-primary-light", border: "border-primary" },
    { label: "Classes Today", value: todayCount, text: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-600" },
    { label: "School Days", value: DAYS.length, text: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-600" },
    { label: "Daily Avg.", value: Math.round(totalClasses / DAYS.length) || 0, text: "text-warning", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-warning" },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">My Schedule</h1>
        <p className="page-subtitle">Your weekly teaching timetable.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.bg} border ${s.border}`}>
            <div className={`stat-value ${s.text}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly overview */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-semibold text-text flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          Weekly Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {DAYS.map((day, di) => {
            const dayClasses = schedule.filter(s => s.day === day)
            const color = DAY_COLORS[di]
            const isToday = day === today
            const isActive = day === activeDay
            const maxCount = Math.max(...DAYS.map(d => schedule.filter(s => s.day === d).length), 1)
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex flex-col gap-2 p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer
                  ${isActive
                    ? "border-primary bg-primary-light"
                    : "border-border bg-surface hover:bg-surface-2"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-base font-semibold ${isActive ? "text-primary" : "text-muted"}`}>
                    {day.slice(0, 3)}
                  </span>
                  {isToday && (
                    <span className="text-xs font-medium text-primary-light bg-text px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl font-bold text-text">{dayClasses.length}</div>
                  <div className="text-sm text-muted mt-1">
                    {dayClasses.length === 1 ? "class" : "classes"}
                  </div>
                </div>
                <div className="w-full h-1 rounded-full mt-1" style={{ background: `${color}30` }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(dayClasses.length / maxCount) * 100}%`,
                      background: color,
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Day tabs */}
      {/* <div className="flex gap-2 flex-wrap">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 cursor-pointer border
              ${activeDay === day
                ? "bg-primary text-white border-primary"
                : "bg-surface text-muted border-border hover:text-text"
              }`}
          >
            {day}
            {day === today && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-success align-middle" />
            )}
          </button>
        ))}
      </div> */}

      {/* Schedule cards */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <CalendarDays size={36} className="text-faint" />
          <p className="text-muted text-sm">No classes scheduled for {activeDay}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((cls, i) => {
            const color = DAY_COLORS[DAYS.indexOf(activeDay) % DAY_COLORS.length]
            return (
              <div key={cls.id} className="card flex items-center gap-5 py-4">

                {/* Period number */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 text-white"
                  style={{ background: color }}
                >
                  {i + 1}
                </div>

                <div className="flex flex-1 md:gap-4 flex-col md:flex-row">
                  {/* Time */}
                  <div className="flex gap-2 md:gap-0 md:flex-col items-center shrink-0 w-16">
                    <span className="text-sm font-semibold text-text whitespace-nowrap">{cls.start_time}</span>
                    <span className="text-xs text-faint">to</span>
                    <span className="text-sm font-semibold text-text whitespace-nowrap">{cls.end_time}</span>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-px self-stretch bg-border shrink-0" />

                  {/* Subject + class info */}
                  <div className="flex-1 min-w-0 flex md:flex-col items-center md:items-start gap-2 flex-wrap">
                    <p className="font-semibold text-text text-sm">{cls.subjects?.name}</p>
                    <p className="text-xs text-muted md:mt-0.5">{cls.classes?.name}</p>
                  </div>
                </div>

                {/* Room */}
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted">Room</div>
                  <div className="text-sm font-bold text-text">{cls.room}</div>
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}