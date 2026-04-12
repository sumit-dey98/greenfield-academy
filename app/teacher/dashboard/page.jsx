'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import {
  Users, CalendarDays, CalendarCheck,
  Bell, Clock, ArrowRight, Calendar, AlertCircle,
} from "lucide-react"
import ExamResultsChart from "@/components/teacher/ExamResultsChart"

const categoryBadge = {
  Event: "badge-info",
  Exam: "badge-danger",
  General: "badge-success",
  Meeting: "badge-warning",
  Holiday: "badge-info",
}

const COLORS = {
  primary: "#059669",
  info: "#0891b2",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#9333ea",
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function TeacherDashboard() {
  const [students, setStudents] = useState([])
  const [schedule, setSchedule] = useState([])
  const [notices, setNotices] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    const fetchAll = async () => {
      const today = new Date().toISOString().split("T")[0]

      const [studentsRes, scheduleRes, noticesRes, attendanceRes] = await Promise.all([
        supabase.from("students").select("*").eq("class_id", user.class_id),
        supabase.from("schedule").select("*, subjects(name)").eq("teacher_id", user.id),
        supabase.from("notices").select("*").order("date", { ascending: false }).limit(4),
        supabase.from("attendance").select("*").in(
          "student_id",
          []
        ),
      ])

      if (studentsRes.data) {
        setStudents(studentsRes.data)

        // fetch today's attendance for these students
        const ids = studentsRes.data.map(s => s.id)
        if (ids.length > 0) {
          const { data: attData } = await supabase
            .from("attendance")
            .select("*")
            .in("student_id", ids)
            .eq("date", today)
          setAttendance(attData ?? [])
        }
      }

      if (scheduleRes.data) setSchedule(scheduleRes.data)
      if (noticesRes.data) setNotices(noticesRes.data)
      setLoading(false)
    }
    fetchAll()
  }, [user])

  const today = DAYS[new Date().getDay()]
  const todaySchedule = schedule.filter(s => s.day === today)
  const totalStudents = students.length
  const markedToday = attendance.length
  const unmarked = totalStudents - markedToday
  const presentToday = attendance.filter(a => a.status === "present").length
  const attendanceRate = markedToday > 0
    ? Math.round((presentToday / markedToday) * 100)
    : null

  const stats = [
    {
      label: "Total Students",
      value: totalStudents,
      sub: "in your class",
      icon: <Users size={20} />,
      color: COLORS.primary,
      bg: "bg-emerald-100 dark:bg-emerald-950",
      border: "ring-emerald-600",
    },
    {
      label: "Classes Today",
      value: todaySchedule.length,
      sub: today,
      icon: <CalendarDays size={20} />,
      color: COLORS.info,
      bg: "bg-cyan-100 dark:bg-cyan-950",
      border: "ring-cyan-600",
    },
    {
      label: "Attendance Today",
      value: attendanceRate !== null ? `${attendanceRate}%` : "—",
      sub: `${markedToday} of ${totalStudents} marked`,
      icon: <CalendarCheck size={20} />,
      color: attendanceRate !== null && attendanceRate >= 75 ? COLORS.primary : COLORS.warning,
      bg: attendanceRate !== null && attendanceRate >= 75 ? "bg-green-100 dark:bg-green-950" : "bg-amber-100 dark:bg-amber-950",
      border: attendanceRate !== null && attendanceRate >= 75 ? "ring-green-600" : "ring-amber-600",
    },
    {
      label: "Unmarked Today",
      value: unmarked,
      sub: unmarked > 0 ? "needs attention" : "all marked",
      icon: <AlertCircle size={20} />,
      color: unmarked > 0 ? COLORS.danger : COLORS.primary,
      bg: unmarked > 0 ? "bg-red-100 dark:bg-red-950" : "bg-green-100 dark:bg-green-950",
      border: unmarked > 0 ? "ring-red-600" : "ring-green-600",
    },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-text">
          Welcome, {user?.name?.split(" ")[0] + " " + user?.name?.split(" ")[1]}
        </h1>
        <p className="text-sm text-muted mt-1">
          Here's an overview of your class and schedule.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ring-1 border-0 ${s.border}/30 ${s.bg}`}>

            <div className="flex-col-reverse md:flex-row flex md:items-center gap-2 justify-between mb-3">
              <span className="text-sm font-medium text-muted">{s.label}</span>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}`, color: 'var(--color-bg)' }}
              >
                {s.icon}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.sub}</div>
            </div>

          </div>
        ))}
      </div>

      {/* Unmarked attendance alert */}
      {unmarked > 0 && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-primary-light border border-primary rounded-lg flex-wrap">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-primary shrink-0" />
            <p className="text-sm font-medium text-text">
              {unmarked} student{unmarked !== 1 ? "s" : ""} not marked for today.
            </p>
          </div>
          <Link href="/teacher/attendance" className="btn btn-primary text-xs">
            Mark Attendance <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <ExamResultsChart />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's schedule */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <Clock size={16} className="text-primary" />
              Today's Classes
              <span className="text-xs text-muted font-normal">({today})</span>
            </h2>
            <Link href="/teacher/schedule" className="text-xs text-primary hover:underline flex items-center gap-1">
              Full schedule <ArrowRight size={12} />
            </Link>
          </div>
          {todaySchedule.length === 0 ? (
            <p className="text-sm text-muted">No classes scheduled for today.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todaySchedule.map((cls, i) => (
                <div key={cls.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-2">
                  <div className="flex flex-col items-center justify-center w-14 shrink-0">
                    <span className="text-xs font-semibold text-primary">{cls.start_time}</span>
                    <span className="text-xs text-faint">{cls.end_time}</span>
                  </div>
                  <div className="w-px h-8 bg-border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{cls.subjects?.name}</p>
                    <p className="text-xs text-muted">Room {cls.room}</p>
                  </div>
                  <span className="text-xs text-faint shrink-0">#{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's attendance summary */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <CalendarCheck size={16} className="text-primary" />
              Today's Attendance
            </h2>
            <Link href="/teacher/attendance" className="text-xs text-primary hover:underline flex items-center gap-1">
              Mark attendance <ArrowRight size={12} />
            </Link>
          </div>

          {markedToday === 0 ? (
            <p className="text-sm text-muted">No attendance marked yet for today.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { label: "Present", value: attendance.filter(a => a.status === "present").length, color: COLORS.primary },
                { label: "Absent", value: attendance.filter(a => a.status === "absent").length, color: COLORS.danger },
                { label: "Late", value: attendance.filter(a => a.status === "late").length, color: COLORS.warning },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-muted w-16 shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: totalStudents > 0 ? `${(item.value / totalStudents) * 100}%` : "0%",
                        background: item.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-text w-6 text-right shrink-0">
                    {item.value}
                  </span>
                </div>
              ))}
              <p className="text-xs text-faint mt-1">
                {markedToday} of {totalStudents} students marked
              </p>
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="card flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <Bell size={16} className="text-primary" />
              Latest Notices
            </h2>
            <Link href="/notices" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notices.map(notice => (
              <div
                key={notice.id}
                className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-2 border border-border"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`badge ${categoryBadge[notice.category] ?? "badge-info"}`}>
                    {notice.category}
                  </span>
                  {notice.priority === "high" && (
                    <span className="badge badge-danger">Urgent</span>
                  )}
                </div>
                <p className="text-sm font-medium text-text leading-snug">{notice.title}</p>
                <div className="flex items-center gap-1 text-xs text-faint mt-auto">
                  <Calendar size={11} />
                  {new Date(notice.date).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}