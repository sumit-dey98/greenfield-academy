'use client'

import { useEffect, useState } from "react"
import { getMyExams, getMySchedule, getMyResults } from "@/lib/api/teachers"
import { useAuth } from "@/context/AuthContext"
import { TrendingUp } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell, LabelList,
} from "recharts"

const COLORS = {
  primary: "#059669",
  info: "#0891b2",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#9333ea",
}

export default function ExamResultsChart({ examIds = null }) {
  const { user } = useAuth()
  const [chartData, setChartData] = useState([])
  const [exams, setExams] = useState([])
  const [examNames, setExamNames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user, examIds])

  const fetchData = async () => {
    setLoading(true)
    try {
      const allExams = await getMyExams()

      let examsToShow = []
      if (examIds) {
        examsToShow = (allExams ?? [])
          .filter(e => examIds.includes(e.id))
          .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
      } else {
        const byEndDesc = (a, b) => new Date(b.end_date) - new Date(a.end_date)
        const grading = (allExams ?? []).filter(e => e.status === "grading").sort(byEndDesc).slice(0, 1)
        const ended = (allExams ?? []).filter(e => e.status === "ended").sort(byEndDesc).slice(0, grading.length > 0 ? 1 : 2)
        examsToShow = [...grading, ...ended]
      }

      if (examsToShow.length === 0) { setExams([]); setLoading(false); return }
      setExamNames(examsToShow.map(e => e.name))

      const slots = await getMySchedule()
      if (!slots || slots.length === 0) { setExams(examsToShow); setChartData([]); setLoading(false); return }

      // Unique (class, subject) combos the teacher teaches.
      const combos = slots.reduce((acc, s) => {
        const key = `${s.class_id}_${s.subject_id}`
        if (!acc.find(x => x.key === key)) {
          acc.push({
            key,
            class_id: s.class_id,
            subject_id: s.subject_id,
            class_name: s.class_name,
            subject_name: s.subject_name,
          })
        }
        return acc
      }, [])

      // Results per (class, exam) — scoped to exactly the exams being charted (usually
      // 1-3) instead of pulling every exam a class has ever sat, then filtering client-side.
      const classIds = [...new Set(combos.map(c => c.class_id))]
      const perClassPerExam = await Promise.all(
        classIds.flatMap(cid =>
          examsToShow.map(exam =>
            getMyResults({ class_id: cid, exam_id: exam.id, limit: 200 })
              .then(page => (page?.items ?? []).map(r => ({ ...r, class_id: cid })))
              .catch(() => [])
          )
        )
      )
      const results = perClassPerExam.flat()

      const data = combos.map(combo => {
        const shortName = combo.class_name
          ?.replace("Class ", "")
          ?.replace(" - Section", "")
          ?.replace(" - ", " ") ?? combo.class_id

        const entry = { name: shortName, subject: combo.subject_name }

        examsToShow.forEach(exam => {
          const comboResults = results.filter(r =>
            r.exam_id === exam.id &&
            r.subject_id === combo.subject_id &&
            r.class_id === combo.class_id
          )
          entry[exam.name] = comboResults.length
            ? Math.round(comboResults.reduce((s, r) => s + r.marks, 0) / comboResults.length)
            : null
          entry[`${exam.name}_count`] = comboResults.length
          entry[`${exam.name}_status`] = exam.status
        })

        return entry
      }).filter(d => examsToShow.some(e => d[e.name] !== null))

      setChartData(data)
      setExams(examsToShow)
    } catch (err) {
      console.error("Failed to load chart:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="card flex items-center justify-center h-48">
      <div className="text-muted text-sm">Loading chart...</div>
    </div>
  )

  if (exams.length === 0) return (
    <div className="card flex items-center justify-center h-48">
      <p className="text-sm text-muted">No exams found.</p>
    </div>
  )

  if (chartData.length === 0) return (
    <div className="card flex items-center justify-center h-48">
      <p className="text-sm text-muted">No results recorded yet.</p>
    </div>
  )

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-text flex items-center gap-2 text-base">
          <TrendingUp size={16} className="text-primary" />
          Class Performance
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
          {exams.map((exam, i) => {
            const color = exam.status === "grading"
              ? "#9333ea"
              : i === 0 ? "#059669" : "#0891b2"
            return (
              <span key={exam.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                {exam.name}
                {exam.status === "grading" && (
                  <span className="badge badge-info">grading</span>
                )}
              </span>
            )
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          barSize={exams.length > 1 ? 20 : 36}
          barGap={4}
          margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            axisLine={false}
            tickLine={false}
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
            cursor={{ fill: "rgba(5,150,105,0.06)" }}
            formatter={(val, name, props) => [
              val ? `${val}/100` : "No data",
              `${name} (${props.payload[`${name}_count`]} students)`,
            ]}
          />
          {exams.map((exam, i) => {
            const color = exam.status === "grading"
              ? "#9333ea"
              : i === 0 ? "#059669" : "#0891b2"
            return (
              <Bar
                key={exam.id}
                dataKey={exam.name}
                name={exam.name}
                fill={color}
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey={exam.name}
                  position="top"
                  style={{ fontSize: "10px", fill: "var(--color-muted)" }}
                  formatter={v => v ? `${v}%` : ""}
                />
              </Bar>
            )
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}