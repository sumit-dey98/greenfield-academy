'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Users, ChevronDown, Phone, MapPin, User, TrendingUp, Eye } from "lucide-react"
import DataTable from "@/components/ui/DataTable"
import SearchBox from "@/components/ui/SearchBox"
import Modal from "@/components/ui/Modal"

const COLORS = {
  primary: "#059669",
  info: "#0891b2",
  danger: "#ef4444",
  warning: "#f59e0b",
}

const gradeColor = {
  "A+": "badge-success", "A": "badge-success", "A-": "badge-success",
  "B+": "badge-info", "B": "badge-info", "B-": "badge-info",
  "C+": "badge-warning", "C": "badge-warning",
  "F": "badge-danger",
}

export default function TeacherStudents() {
  const { user, setUser } = useAuth()
  const [students, setStudents] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!user) return
    const fetchAll = async () => {
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", user.class_id)
        .order("roll", { ascending: true })

      if (studentData) {
        setStudents(studentData)

        // fetch results for teacher's subject for these students
        const ids = studentData.map(s => s.id)
        if (ids.length > 0) {
          const { data: resultData } = await supabase
            .from("results")
            .select("*, subjects(name, code)")
            .in("student_id", ids)
            .eq("subjects.name", user.subject)

          // filter results where subject matches teacher's subject
          const filtered = (resultData ?? []).filter(
            r => r.subjects?.name === user.subject
          )
          setResults(filtered)
        }
      }

      setLoading(false)
    }
    fetchAll()
  }, [user])

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    String(s.roll).includes(search)
  )

  const getStudentResults = (studentId) =>
    results.filter(r => r.student_id === studentId)

  const getAvgMarks = (studentId) => {
    const sr = getStudentResults(studentId)
    if (!sr.length) return null
    return Math.round(sr.reduce((sum, r) => sum + r.marks, 0) / sr.length)
  }

  const initials = (name) => name
    ?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  const columns = [
    {
      key: "roll",
      label: "Roll",
      sortable: true,
      width: 70,
      render: (row) => (
        <span className="text-sm font-medium text-muted">{row.roll}</span>
      ),
    },
    {
      key: "name",
      label: "Student",
      sortable: true,
      width: 220,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden border border-border"
            style={{ background: COLORS.primary }}
          >
            {/* {initials(row.name)} */}
            <img src={row.avatar} alt={row.name} className="bg-top"/>
          </div>
          <span className="text-sm font-medium text-text truncate">{row.name}</span>
        </div>
      ),
    },
    {
      key: "gender",
      label: "Gender",
      sortable: true,
      width: 100,
      render: (row) => (
        <span className="text-sm text-muted">{row.gender}</span>
      ),
    },
    {
      key: "avgMarks",
      label: `${user?.subject ?? "Subject"} Avg.`,
      sortable: false,
      width: 140,
      render: (row) => {
        const avg = getAvgMarks(row.id)
        if (avg === null) return <span className="text-xs text-faint">No results</span>
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${avg}%`,
                  background: avg >= 80 ? COLORS.primary : avg >= 60 ? COLORS.info : COLORS.danger,
                }}
              />
            </div>
            <span className="text-sm font-semibold text-text">{avg}%</span>
          </div>
        )
      },
    },
    {
      key: "guardian",
      label: "Guardian",
      sortable: false,
      width: 160,
      render: (row) => (
        <span className="text-sm text-muted truncate">{row.guardian}</span>
      ),
    },
    {
      key: "expand",
      label: "View",
      sortable: false,
      width: 50,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(expanded === row.id ? null : row.id)
          }}
          className="p-1.5 rounded-md hover:bg-surface-2 text-faint hover:text-text transition-colors"
        >
          <Eye size={15} />
        </button>
      ),
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
        <h1 className="page-title">Students</h1>
        <p className="page-subtitle">
          {students.length} students in your class.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchBox
          placeholder="Search by name or roll..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />
      </div>

      {/* Table */}
      <DataTable
        key={search}
        columns={columns}
        data={filtered}
        pageSize={20}
        loading={loading}
        emptyMessage="No students found."
      />

      {/* Student detail modal */}
      <Modal
        open={!!expanded}
        onClose={() => setExpanded(null)}
        title={expanded ? students.find(s => s.id === expanded)?.name ?? "Student Detail" : ""}
        width="max-w-3xl"
      >
        {expanded && (() => {
          const student = students.find(s => s.id === expanded)
          if (!student) return null
          const studentResults = getStudentResults(student.id)
          return (
            <div className="flex flex-col gap-6">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0 border border-border overflow-hidden"
                  style={{ background: COLORS.primary }}
                >
                  {/* {initials(student.name)} */}
                  <img src={student.avatar} alt={student.name} />
                </div>
                <div>
                  <h3 className="font-bold text-text">{student.name}</h3>
                  <p className="text-xs text-muted">Roll {student.roll} · {student.gender}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Personal info */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wide">
                    Personal Details
                  </h4>
                  {[
                    { icon: <User size={14} />, label: "Date of Birth", value: student.dob ? new Date(student.dob).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—" },
                    { icon: <Phone size={14} />, label: "Phone", value: student.phone },
                    { icon: <MapPin size={14} />, label: "Address", value: student.address },
                    { icon: <User size={14} />, label: "Guardian", value: student.guardian },
                    { icon: <Phone size={14} />, label: "Guardian Phone", value: student.guardian_phone },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-faint mt-0.5 shrink-0">{item.icon}</span>
                      <div>
                        <div className="text-xs text-muted">{item.label}</div>
                        <div className="text-sm font-medium text-text">{item.value ?? "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subject results */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingUp size={13} />
                    {user?.subject} Results
                  </h4>
                  {studentResults.length === 0 ? (
                    <p className="text-sm text-muted">No results recorded yet.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {studentResults.map(r => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface2 shadow-hover border-border"
                        >
                          <div>
                            <p className="text-sm font-medium text-text">{r.exam}</p>
                            <p className="text-xs text-muted">{r.remarks}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${r.marks}%`,
                                  background: r.marks >= 80 ? COLORS.primary : r.marks >= 60 ? COLORS.info : COLORS.danger,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-text">{r.marks}/{r.total}</span>
                            <span className={`badge ${gradeColor[r.grade] ?? "badge-info"}`}>
                              {r.grade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )
        })()}
      </Modal>

    </div>
  )
}