'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { TrendingUp, Award, BookOpen } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts"

const gradeColor = {
  "A+": "badge-success", "A": "badge-success", "A-": "badge-success",
  "B+": "badge-info", "B": "badge-info", "B-": "badge-info",
  "C+": "badge-warning", "C": "badge-warning",
  "F": "badge-danger",
}

const COLORS = {
  primary: "#059669",
  info: "#0891b2",
  danger: "#ef4444",
  warning: "#f59e0b",
}

export default function StudentResults() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [examRecords, setExamRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeExam, setActiveExam] = useState("")
  const [chartWidth, setChartWidth] = useState(0);
  const isMobile = chartWidth > 0 && chartWidth < 768;

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const [resultsRes, examsRes] = await Promise.all([
        supabase
          .from("results")
          .select("*, subjects(name, code)")
          .eq("student_id", user.id)
          .order("exam", { ascending: true }),
        supabase
          .from("exams")
          .select("name, start_date")
          .order("start_date", { ascending: false }),
      ])
      if (resultsRes.data) setResults(resultsRes.data)
      if (examsRes.data) setExamRecords(examsRes.data)
      setLoading(false)
    }
    fetch()
  }, [user])

  useEffect(() => {
    if (results.length > 0 && !activeExam) {
      const latest = [...new Set(results.map(r => r.exam))].sort((a, b) => b.localeCompare(a))[0]
      setActiveExam(latest)
    }
  }, [results])

  const exams = [...new Set(results.map(r => r.exam))]
    .sort((a, b) => {
      const aDate = examRecords.find(e => e.name === a)?.start_date ?? ""
      const bDate = examRecords.find(e => e.name === b)?.start_date ?? ""
      return new Date(bDate) - new Date(aDate)
    })

  const filtered = activeExam ? results.filter(r => r.exam === activeExam) : []

  const avgMarks = filtered.length
    ? Math.round(filtered.reduce((sum, r) => sum + r.marks, 0) / filtered.length) : 0
  const highest = filtered.length ? Math.max(...filtered.map(r => r.marks)) : 0
  const lowest = filtered.length ? Math.min(...filtered.map(r => r.marks)) : 0

  const barData = filtered.map(r => ({
    name: r.subjects?.name?.split(" ")[0] ?? "—",
    marks: r.marks,
    total: r.total,
  }))

  const stats = [
    {
      label: "Average Marks",
      value: `${avgMarks}%`,
      icon: <TrendingUp size={18} />,
      color: COLORS.primary,
      text: "text-primary",
      bg: "bg-primary-light",
      border: "border-primary",
    },
    {
      label: "Highest",
      value: `${highest}%`,
      icon: <Award size={18} />,
      color: COLORS.info,
      text: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      border: "border-cyan-500",
    },
    {
      label: "Lowest",
      value: `${lowest}%`,
      icon: <BookOpen size={18} />,
      color: COLORS.warning,
      text: "text-warning",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-warning",
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
        <h1 className="page-title">Exam Results</h1>
        <p className="page-subtitle">View your marks and grades across all exams.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.bg} border ${s.border}`}>
            <div className="flex-col-reverse md:flex-row flex md:items-center gap-2 justify-between mb-3">
              <span className="text-sm font-medium text-muted">{s.label}</span>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}18`, color: s.color, boxShadow: `0 0 1px 1px ${s.color}40` }}
              >
                {s.icon}
              </div>
            </div>
            <div className={`stat-value ${s.text}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Exam filter */}
      <div className="flex gap-2 flex-wrap">
        {exams.map(exam => (
          <button
            key={exam}
            onClick={() => setActiveExam(exam)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 cursor-pointer border
        ${activeExam === exam
                ? "bg-primary text-white border-primary"
                : "bg-surface text-muted border-border hover:text-text"
              }`}
          >
            {exam}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      {barData.length > 0 && (
        <div className="card flex flex-col gap-4">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Marks by Subject
          </h2>
          <ResponsiveContainer width="100%" height={isMobile ? 260 : 220} onResize={(w) => setChartWidth(w)}>
            <BarChart
              data={barData}
              barSize={32}
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
              <ReferenceLine y={avgMarks} stroke="var(--color-faint)" strokeDasharray="4 4" label={{ value: "avg", fontSize: 10, fill: "var(--color-faint)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--color-text)",
                }}
                cursor={{ fill: "var(--color-surface2)" }}
                formatter={(v, _, props) => [`${v}/${props.payload.total}`, "Marks"]}
              />
              <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.marks >= 80 ? COLORS.primary : entry.marks >= 60 ? COLORS.info : COLORS.danger}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex md:items-center gap-3 md:gap-5 text-xs text-muted flex-wrap">
            {[
              { label: "≥ 80% — Strong", color: COLORS.primary },
              { label: "60–79% — Average", color: COLORS.info },
              { label: "< 60% — Needs work", color: COLORS.danger },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results table */}
      <div className="card p-0 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Code</th>
              <th>Exam</th>
              <th>Marks</th>
              <th>Grade</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-8">No results found.</td>
              </tr>
            ) : (
              filtered.map(result => (
                <tr key={result.id}>
                  <td className="font-medium text-text">{result.subjects?.name}</td>
                  <td className="text-muted">{result.subjects?.code}</td>
                  <td className="text-muted">{result.exam}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${result.marks}%`,
                            background: result.marks >= 80 ? COLORS.primary : result.marks >= 60 ? COLORS.info : COLORS.danger,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-text whitespace-nowrap">
                        {result.marks}/{result.total}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${gradeColor[result.grade] ?? "badge-info"}`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{result.remarks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}