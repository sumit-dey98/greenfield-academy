'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
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

    let examsToShow = []

    if (examIds) {
      const { data } = await supabase
        .from("exams")
        .select("*")
        .in("id", examIds)
        .order("end_date", { ascending: false })
      examsToShow = data ?? []
    } else {
      const { data: gradingExams } = await supabase
        .from("exams")
        .select("*")
        .eq("status", "grading")
        .order("end_date", { ascending: false })
        .limit(1)

      const { data: endedExams } = await supabase
        .from("exams")
        .select("*")
        .eq("status", "ended")
        .order("end_date", { ascending: false })
        .limit(gradingExams?.length > 0 ? 1 : 2)

      examsToShow = [
        ...(gradingExams ?? []),
        ...(endedExams ?? []),
      ]
    }

    if (examsToShow.length === 0) { setLoading(false); return }
    setExamNames(examsToShow.map(e => e.name))

    const { data: slots } = await supabase
      .from("schedule")
      .select("class_id, subject_id, subjects(name), classes(name, grade)")
      .eq("teacher_id", user.id)

    if (!slots || slots.length === 0) { setLoading(false); return }

    const combos = slots.reduce((acc, s) => {
      const key = `${s.class_id}_${s.subject_id}`
      if (!acc.find(x => x.key === key)) {
        acc.push({
          key,
          class_id: s.class_id,
          subject_id: s.subject_id,
          class_name: s.classes?.name,
          subject_name: s.subjects?.name,
          grade: s.classes?.grade,
        })
      }
      return acc
    }, [])

    const classIds = [...new Set(combos.map(c => c.class_id))]
    const subjectIds = [...new Set(combos.map(c => c.subject_id))]

    const { data: students } = await supabase
      .from("students")
      .select("id, class_id")
      .in("class_id", classIds)

    const studentIds = students?.map(s => s.id) ?? []
    if (studentIds.length === 0) { setLoading(false); return }

    const examNamesList = examsToShow.map(e => e.name)

    const { data: results } = await supabase
      .from("results")
      .select("student_id, subject_id, marks, exam")
      .in("exam", examNamesList)
      .in("student_id", studentIds)
      .in("subject_id", subjectIds)

    if (!results) { setLoading(false); return }

    const data = combos.map(combo => {
      const classStudents = students?.filter(s => s.class_id === combo.class_id) ?? []
      const shortName = combo.class_name
        ?.replace("Class ", "")
        ?.replace(" - Section", "")
        ?.replace(" - ", " ") ?? combo.class_id

      const entry = { name: shortName, subject: combo.subject_name }

      examsToShow.forEach(exam => {
        const comboResults = results.filter(r =>
          r.exam === exam.name &&
          r.subject_id === combo.subject_id &&
          classStudents.some(s => s.id === r.student_id)
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
    setLoading(false)
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