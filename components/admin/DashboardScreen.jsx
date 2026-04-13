'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import {
  Users, User, BookOpen, Bell, Calendar,
  TrendingUp, ArrowRight, GraduationCap,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell,
} from "recharts"

const COLORS = {
  primary: "#059669",
  info: "#0891b2",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#9333ea",
}

export default function DashboardScreen({ basePath = "/admin" }) {
  const [stats, setStats] = useState({})
  const [notices, setNotices] = useState([])
  const [classes, setClasses] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [
        studentsRes, teachersRes, classesRes,
        noticesRes, eventsRes, examRes,
      ] = await Promise.all([
        supabase.from("students").select("id, class_id"),
        supabase.from("teachers")
          .select("id")
          .not("role", "in", '("Chairman")'),
        supabase.from("classes").select("id, name, grade"),
        supabase.from("notices").select("*").order("date", { ascending: false }).limit(5),
        supabase.from("events").select("id").eq("published", true),
        supabase.from("exams")
          .select("name")
          .eq("status", "ended")
          .order("end_date", { ascending: false })
          .limit(1)
          .single(),
      ])

      const latestExam = examRes.data?.name
      const { data: resultsData } = latestExam
        ? await supabase.from("results").select("marks").eq("exam", latestExam)
        : { data: [] }

      setStats({
        students: studentsRes.data?.length ?? 0,
        teachers: teachersRes.data?.length ?? 0,
        classes: classesRes.data?.length ?? 0,
        notices: noticesRes.data?.length ?? 0,
        events: eventsRes.data?.length ?? 0,
      })
      setNotices(noticesRes.data ?? [])
      setClasses(classesRes.data ?? [])
      setResults(resultsData ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const classData = classes.map(cls => ({
    name: cls.name.replace("Class ", "").replace(" - ", "\n"),
    grade: cls.grade,
  }))

  const avgMarks = results.length
    ? Math.round(results.reduce((s, r) => s + r.marks, 0) / results.length)
    : 0

  const statCards = [
    {
      label: "Total Students",
      value: stats.students,
      icon: <Users size={20} />,
      color: COLORS.primary,
      text: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-950/30",
      border: "ring-emerald-600/30",
      href: `${basePath}/students`,
    },
    {
      label: "Teachers",
      value: stats.teachers,
      icon: <GraduationCap size={20} />,
      color: COLORS.info,
      text: "text-cyan-600",
      bg: "bg-cyan-100 dark:bg-cyan-950/30",
      border: "ring-cyan-600/30",
      href: `${basePath}/teachers`,
    },
    {
      label: "Classes",
      value: stats.classes,
      icon: <BookOpen size={20} />,
      color: COLORS.purple,
      text: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-950/30",
      border: "ring-purple-600/30",
      href: `${basePath}/classes`,
    },
    {
      label: "Notices",
      value: stats.notices,
      icon: <Bell size={20} />,
      color: COLORS.warning,
      text: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-950/30",
      border: "ring-amber-600/30",
      href: `${basePath}/notices`,
    },
    {
      label: "Events",
      value: stats.events,
      icon: <Calendar size={20} />,
      color: COLORS.danger,
      text: "text-red-600",
      bg: "bg-red-100 dark:bg-red-950/30",
      border: "ring-red-600/30",
      href: `${basePath}/events`,
    },
    {
      label: "Avg. Final Marks",
      value: `${avgMarks}%`,
      icon: <TrendingUp size={20} />,
      color: COLORS.primary,
      text: "text-green-600",
      bg: "bg-green-100 dark:bg-green-950/30",
      border: "ring-green-600/30",
      href: `${basePath}/students`,
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
        <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
        <p className="text-sm text-muted mt-1">School-wide overview and quick access.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className={`stat-card ${s.bg} border-0 ring-1 ${s.border}  no-underline block`} >
            <div className="flex-col-reverse md:flex-row flex md:items-center gap-2 justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}`, color: 'var(--color-bg)' }}
              >
                {s.icon}
              </div>
            </div>
            <div className={`stat-value ${s.text}`}>{s.value}</div>
            <div className={`${s.text} text-sm`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-4">
        <h2 className="font-semibold text-text">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Add Notice", href: `${basePath}/notices`, color: COLORS.warning, icon: <Bell size={18} /> },
            { label: "Add Event", href: `${basePath}/events`, color: COLORS.info, icon: <Calendar size={18} /> },
            { label: "Manage Students", href: `${basePath}/students`, color: COLORS.primary, icon: <Users size={18} /> },
            { label: "Manage Teachers", href: `${basePath}/teachers`, color: COLORS.primary, icon: <User size={18} /> },
            { label: "Settings", href: `${basePath}/settings`, color: COLORS.purple, icon: <TrendingUp size={18} /> },
          ].map((a, i) => (
            <Link
              key={i}
              href={a.href}
              style={{ background: `${a.color}20`, boxShadow: `0 0 1px 1px ${a.color}40` }}
              onMouseEnter={e => e.currentTarget.style.background = `${a.color}40`}
              onMouseLeave={e => e.currentTarget.style.background = `${a.color}20`}
              className={`flex sm:items-center gap-3 p-4 rounded-lg flex-col sm:flex-row bg-surface hover:!bg-${a.color} hover:ring hover:ring-surface-2 no-underline transition-all duration-200`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${a.color}`, color: 'var(--color-bg)' }}
              >
                {a.icon}
              </div>
              <span className="text-sm font-medium text-text">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts + notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Results bar chart */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <TrendingUp size={16} className="text-primary" />
              Final 2024 — Marks Distribution
            </h2>
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-muted">No results data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { range: "90-100", count: results.filter(r => r.marks >= 90).length },
                  { range: "80-89", count: results.filter(r => r.marks >= 80 && r.marks < 90).length },
                  { range: "70-79", count: results.filter(r => r.marks >= 70 && r.marks < 80).length },
                  { range: "60-69", count: results.filter(r => r.marks >= 60 && r.marks < 70).length },
                  { range: "Below 60", count: results.filter(r => r.marks < 60).length },
                ]}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px", color: "var(--color-text)" }}
                  cursor={{ fill: "rgba(5,150,105,0.06)" }}
                  formatter={(v) => [v, "Students"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {[COLORS.primary, COLORS.info, COLORS.warning, COLORS.warning, COLORS.danger].map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent notices */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text flex items-center gap-2 text-base">
              <Bell size={16} className="text-primary" />
              Recent Notices
            </h2>
            <Link href={`${basePath}/notices`} className="text-xs text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {notices.map(n => (
              <div key={n.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-surface-2 shadow-hover">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{n.title}</p>
                  <p className="text-xs text-faint">
                    {new Date(n.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`badge shrink-0 ${n.priority === "high" ? "badge-danger" : "badge-info"}`}>
                  {n.priority === "high" ? "Urgent" : n.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}