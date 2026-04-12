'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CalendarCheck, CalendarX, Clock, Percent } from "lucide-react"
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts"
import DataTable from "@/components/ui/DataTable"
import { useAuth } from "@/context/AuthContext"

const statusStyles = {
  present: { badge: "badge-success", label: "Present" },
  absent: { badge: "badge-danger", label: "Absent" },
  late: { badge: "badge-warning", label: "Late" },
}

const COLORS = {
  primary: "#059669",
  danger: "#ef4444",
  warning: "#f59e0b",
}

export default function StudentAttendance() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", user.id)
        .order("date", { ascending: false })
      if (data) setAttendance(data)
      setLoading(false)
    }
    fetch()
  }, [user])

  const total = attendance.length
  const present = attendance.filter(a => a.status === "present").length
  const absent = attendance.filter(a => a.status === "absent").length
  const late = attendance.filter(a => a.status === "late").length
  const rate = total ? Math.round((present / total) * 100) : 0

  const monthlyMap = {}
  attendance.forEach(a => {
    const d = new Date(a.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const month = d.toLocaleDateString("en-GB", { month: "short" })
    const year = d.getFullYear()
    const isCurrentMonth = d.getMonth() === new Date().getMonth() && year === new Date().getFullYear()
    const daysInMonth = isCurrentMonth
      ? new Date().getDate()
      : new Date(year, d.getMonth() + 1, 0).getDate()
    const label = `${month} 1–${daysInMonth}`

    if (!monthlyMap[key]) monthlyMap[key] = {
      key,
      month,
      legend: label,
      present: 0, absent: 0, late: 0,
    }
    monthlyMap[key][a.status]++
  })

  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6)

  const stats = [
    {
      label: "Attendance Rate",
      value: `${rate}%`,
      icon: <Percent size={18} />,
      color: rate >= 75 ? COLORS.primary : COLORS.danger,
      text: rate >= 75 ? "text-emerald-600" : "text-red-600",
      bg: rate >= 75 ? "bg-emerald-100 dark:bg-emerald-950/30" : "bg-red-100 dark:bg-red-950/30",
      ring: rate >= 75 ? "ring-emerald-600/30" : "ring-red-600/30",
    },
    {
      label: "Present",
      value: present,
      icon: <CalendarCheck size={18} />,
      color: COLORS.primary,
      text: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-950/30",
      ring: "ring-emerald-600/30",
    },
    {
      label: "Absent",
      value: absent,
      icon: <CalendarX size={18} />,
      color: COLORS.danger,
      text: "text-red-600",
      bg: "bg-red-100 dark:bg-red-950/30",
      ring: "ring-red-600/30",
    },
    {
      label: "Late",
      value: late,
      icon: <Clock size={18} />,
      color: COLORS.warning,
      text: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-950/30",
      ring: "ring-amber-600/30",
    },
  ]

  const filters = ["all", "present", "absent", "late"]
  const filtered = activeFilter === "all"
    ? attendance
    : attendance.filter(a => a.status === activeFilter)

  const columns = [
    {
      key: "index",
      label: "#",
      sortable: false,
      width: 60,
      render: (row, i) => (
        <span className="text-sm text-muted">{i + 1}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      width: 160,
      render: (row) => (
        <span className="text-sm font-medium text-text">
          {new Date(row.date).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "day",
      label: "Day",
      sortable: false,
      width: 140,
      render: (row) => (
        <span className="text-sm text-muted">
          {new Date(row.date).toLocaleDateString("en-GB", { weekday: "long" })}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: 120,
      render: (row) => {
        const style = statusStyles[row.status] ?? statusStyles.present
        const dotColor = {
          present: "bg-success",
          absent: "bg-danger",
          late: "bg-warning",
        }
        return (
          <span className={`badge ${style.badge} flex items-center gap-1.5 w-fit`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor[row.status]}`} />
            {style.label}
          </span>
        )
      },
    },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Track your attendance record and punctuality.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card border-0 ring-1 ${s.bg} ${s.ring}`}>
            <div className="flex-col-reverse md:flex-row flex md:items-center gap-2 justify-between mb-3">
              <span className="text-sm font-medium text-muted">{s.label}</span>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: s.color, color: "var(--color-bg)", boxShadow: `0 0 1px 1px ${s.color}40` }}
              >
                {s.icon}
              </div>
            </div>
            <div className={`stat-value ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-text">Overall Attendance</span>
          <span className="font-bold text-text">{rate}%</span>
        </div>
        <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden flex">
          {total > 0 && <>
            <div className="h-full transition-all duration-500" style={{ width: `${(present / total) * 100}%`, background: COLORS.primary }} />
            <div className="h-full transition-all duration-500" style={{ width: `${(late / total) * 100}%`, background: COLORS.warning }} />
            <div className="h-full transition-all duration-500" style={{ width: `${(absent / total) * 100}%`, background: COLORS.danger }} />
          </>}
        </div>
        <div className="flex items-center gap-3 md:gap-5 text-xs text-muted flex-wrap">
          {[
            { label: `Present (${present})`, color: COLORS.primary },
            { label: `Absent (${absent})`, color: COLORS.danger },
            { label: `Late (${late})`, color: COLORS.warning },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Monthly chart */}
      {monthlyData.length > 0 && (
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <CalendarCheck size={16} className="text-primary" />
              Monthly Attendance
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted">
              {[
                { label: "Present", color: COLORS.primary },
                { label: "Late", color: COLORS.warning },
                { label: "Absent", color: COLORS.danger },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className="w-5 h-0.5 rounded-full shrink-0" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--color-text)",
                }}
                cursor={{ fill: "rgba(5,150,105,0.06)" }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.legend ?? ""}
                formatter={(val, name) => [val, name]}
              />
              <Line
                type="monotone"
                dataKey="present"
                name="Present"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.primary, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="late"
                name="Late"
                stroke={COLORS.warning}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.warning, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="absent"
                name="Absent"
                stroke={COLORS.danger}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.danger, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 cursor-pointer border capitalize
              ${activeFilter === f
                ? "bg-primary text-white border-primary"
                : "bg-surface text-muted border-border hover:text-text"
              }`}
          >
            {f === "all" ? "All" : `${f.charAt(0).toUpperCase() + f.slice(1)} (${attendance.filter(a => a.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        pageSize={20}
        loading={loading}
        emptyMessage="No records found."
      />

    </div>
  )
}