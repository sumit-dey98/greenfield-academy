'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import {
  ClipboardList, CalendarCheck, CalendarDays,
  TrendingUp, Bell, Clock, ArrowRight, Calendar,
} from "lucide-react"
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts"

const categoryBadge = {
  Event: "badge-info",
  Exam: "badge-danger",
  General: "badge-success",
  Meeting: "badge-warning",
  Holiday: "badge-info",
}

const COLORS = {
  primary: "#059669",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#0891b2",
  purple: "#9333ea",
  surface2: "#e8faf3",
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [attendance, setAttendance] = useState([])
  const [notices, setNotices] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartWidth, setChartWidth] = useState(0);
  const isMobile = chartWidth > 0 && chartWidth < 768;

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [resultsRes, attendanceRes, noticesRes, scheduleRes] = await Promise.all([
        supabase.from("results").select("*, subjects(name)").eq("student_id", user.id),
        supabase.from("attendance").select("*").eq("student_id", user.id),
        supabase.from("notices").select("*").order("date", { ascending: false }).limit(4),
        supabase.from("schedule").select("*, subjects(name)").eq("class_id", user.class_id),
      ])
      if (resultsRes.data) setResults(resultsRes.data)
      if (attendanceRes.data) setAttendance(attendanceRes.data)
      if (noticesRes.data) setNotices(noticesRes.data)
      if (scheduleRes.data) setSchedule(scheduleRes.data)
      setLoading(false)
    }
    fetchData()
  }, [user])

  // Attendance stats
  const totalDays = attendance.length
  const totalPresent = attendance.filter(a => a.status === "present").length
  const totalAbsent = attendance.filter(a => a.status === "absent").length
  const totalLate = attendance.filter(a => a.status === "late").length
  const attendancePct = totalDays ? Math.round((totalPresent / totalDays) * 100) : 0

  // Results stats
  const latestExamName = results.length
    ? [...new Set(results.map(r => r.exam))].sort().at(-1)
    : null

  const latestExam = results.filter(r => r.exam === latestExamName)

  const avgMarks = latestExam.length
    ? Math.round(latestExam.reduce((sum, r) => sum + r.marks, 0) / latestExam.length)
    : 0

  const marksBarData = latestExam.map(r => ({
    name: r.subjects?.name?.split(" ")[0] ?? "—",
    marks: r.marks,
  }))

  // Today's schedule
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const today = days[new Date().getDay()]
  const todaySchedule = schedule.filter(s => s.day === today)

  // Recharts data
  const attendanceDonut = [
    { name: "Present", value: totalPresent, fill: COLORS.primary },
    { name: "Absent", value: totalAbsent, fill: COLORS.danger },
    { name: "Late", value: totalLate, fill: COLORS.warning },
  ]

  const stats = [
    {
      label: "Attendance Rate",
      value: `${attendancePct}%`,
      sub: `${totalPresent} of ${totalDays} days`,
      icon: <CalendarCheck size={20} />,
      color: COLORS.primary,
      text: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-950/30",
      ring: "ring-emerald-600/30",
    },
    {
      label: "Avg. Marks (Final)",
      value: `${avgMarks}%`,
      sub: `${latestExam.length} subjects`,
      icon: <TrendingUp size={20} />,
      color: COLORS.info,
      text: "text-cyan-600",
      bg: "bg-cyan-100 dark:bg-cyan-950/30",
      ring: "ring-cyan-600/30",
    },
    {
      label: "Total Results",
      value: results.length,
      sub: "across all exams",
      icon: <ClipboardList size={20} />,
      color: COLORS.purple,
      text: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-950/30",
      ring: "ring-purple-600/30",
    },
    {
      label: "Classes Today",
      value: todaySchedule.length,
      sub: today,
      icon: <CalendarDays size={20} />,
      color: COLORS.warning,
      text: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-950/30",
      ring: "ring-amber-600/30",
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
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-sm text-muted mt-1">
          Here's an overview of your academic progress.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card border-0 ring-1 ${stat.bg} ${stat.ring}`}>
            <div className="flex-col-reverse md:flex-row flex md:items-center gap-2 justify-between mb-3">
              <span className="text-lg font-medium text-muted">{stat.label}</span>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}`, color: " var(--color-bg)", boxShadow: `0 0 1px 1px ${stat.color}40` }}
              >
                {stat.icon}
              </div>
            </div>
            <div className={`stat-value ${stat.text}`}>{stat.value}</div>
            <div className={`text-sm font-medium ${stat.text} opacity-70`}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Marks bar chart */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <TrendingUp size={16} className="text-primary" />
              Final Exam Marks
            </h2>
            <Link href="/student/results" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {marksBarData.length === 0 ? (
            <p className="text-sm text-muted">No results available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 260 : 200} onResize={(w) => setChartWidth(w)}>
              <BarChart
                data={marksBarData}
                barSize={28}
                margin={{ top: 4, right: 4, left: 0, bottom: isMobile ? 60 : 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-muted)", textAnchor: isMobile ? "end" : "middle" }}
                  axisLine={false}
                  tickLine={false}
                  angle={isMobile ? -65 : 0}
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--color-text)",
                  }}
                  cursor={{ fill: "var(--color-surface2)" }}
                  formatter={(v) => [`${v}%`, "Marks"]}
                />
                <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
                  {marksBarData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.marks >= 80 ? COLORS.primary : entry.marks >= 60 ? COLORS.info : COLORS.danger}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance donut */}
        <div className="card flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <CalendarCheck size={16} className="text-primary" />
              Attendance Breakdown
            </h2>
            <Link href="/student/attendance" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex items-center gap-6 flex-col md:flex-row">
            <div className="relative w-full aspect-square md:w-36 md:h-36 xl:w-52 xl:h-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="100%"
                  data={attendanceDonut}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "var(--color-surface2)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-text">{attendancePct}%</span>
                <span className="text-xs text-muted">Present</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1 w-full">
              <div className="mt-1 w-full h-2 rounded-full bg-surface-2 overflow-hidden flex">
                {totalDays > 0 && <>
                  <div style={{ width: `${(totalPresent / totalDays) * 100}%`, background: COLORS.primary }} className="h-full" />
                  <div style={{ width: `${(totalLate / totalDays) * 100}%`, background: COLORS.warning }} className="h-full" />
                  <div style={{ width: `${(totalAbsent / totalDays) * 100}%`, background: COLORS.danger }} className="h-full" />
                </>}
              </div>
              {[
                { label: "Present", value: totalPresent, color: COLORS.primary },
                { label: "Absent", value: totalAbsent, color: COLORS.danger },
                { label: "Late", value: totalLate, color: COLORS.warning },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-sm text-muted">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-text">{item.value} days</span>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Notices */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <Bell size={16} className="text-primary" />
              Latest Notices
            </h2>
            <Link href="/notices" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {notices.map(notice => (
              <div
                key={notice.id}
                className="flex flex-col gap-1 pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`badge ${categoryBadge[notice.category] ?? "badge-info"}`}>
                    {notice.category}
                  </span>
                  {notice.priority === "high" && (
                    <span className="badge badge-danger">Urgent</span>
                  )}
                </div>
                <p className="text-sm font-medium text-text">{notice.title}</p>
                <div className="flex items-center gap-1 text-xs text-faint">
                  <Calendar size={11} />
                  {new Date(notice.date).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's schedule */}
        <div className="card flex flex-col gap-4">
          <div className="flex md:items-center justify-between flex-col md:flex-row">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <Clock size={16} className="text-primary" />
              Today's Classes
              <span className="text-xs text-muted font-normal">({today})</span>
            </h2>
            <Link href="/student/schedule" className="text-xs text-primary hover:underline flex items-center gap-1">
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

      </div>
    </div>
  )
}