'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { CalendarCheck, CheckCircle, Save, Users } from "lucide-react"
import DatePicker from "@/components/ui/DatePicker"

const STATUS_OPTIONS = ["present", "absent", "late"]

const statusStyle = {
  present: "bg-primary text-white border-primary",
  absent: "bg-danger text-white border-danger",
  late: "bg-warning text-white border-warning",
  null: "bg-surface text-muted border-border",
}

function formatDateForDB(ddmmyyyy) {
  if (!ddmmyyyy) return null
  const [d, m, y] = ddmmyyyy.split("/")
  return `${y}-${m}-${d}`
}

function formatDateForDisplay(isoDate) {
  if (!isoDate) return ""
  const [y, m, d] = isoDate.split("-")
  return `${d}/${m}/${y}`
}

export default function TeacherAttendance() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({}) // { student_id: status }
  const [existing, setExisting] = useState({})   // { student_id: id } — existing row IDs
  const [date, setDate] = useState(formatDateForDisplay(new Date().toISOString().split("T")[0]))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Fetch students once
  useEffect(() => {
    if (!user) return
    const fetchStudents = async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", user.class_id)
        .order("roll", { ascending: true })
      if (data) setStudents(data)
      setLoading(false)
    }
    fetchStudents()
  }, [user])

  // Fetch attendance for selected date
  useEffect(() => {
    if (!user || !date || students.length === 0) return
    const fetchAttendance = async () => {
      const dbDate = formatDateForDB(date)
      const ids = students.map(s => s.id)
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .in("student_id", ids)
        .eq("date", dbDate)

      const attMap = {}
      const existMap = {}
        ; (data ?? []).forEach(row => {
          attMap[row.student_id] = row.status
          existMap[row.student_id] = row.id
        })
      setAttendance(attMap)
      setExisting(existMap)
      setSaved(false)
    }
    fetchAttendance()
  }, [date, students])

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
    setSaved(false)
  }

  const markAll = (status) => {
    const all = {}
    students.forEach(s => { all[s.id] = status })
    setAttendance(all)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const dbDate = formatDateForDB(date)

    const rows = students.map(s => ({
      id: existing[s.id] ?? `att_${s.id}_${dbDate}`,
      student_id: s.id,
      date: dbDate,
      status: attendance[s.id] ?? "absent",
    }))

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,date" })

    if (!error) {
      setSaved(true)
      // refresh existing IDs
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .in("student_id", students.map(s => s.id))
        .eq("date", dbDate)
      const existMap = {}
        ; (data ?? []).forEach(row => { existMap[row.student_id] = row.id })
      setExisting(existMap)
    }
    setSaving(false)
  }

  const markedCount = Object.keys(attendance).length
  const presentCount = Object.values(attendance).filter(s => s === "present").length
  const absentCount = Object.values(attendance).filter(s => s === "absent").length
  const lateCount = Object.values(attendance).filter(s => s === "late").length

  const initials = (name) => name
    ?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Mark and manage attendance for your class.</p>
      </div>

      {/* Date picker + bulk actions */}
      <div className="card flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="w-full sm:w-64">
          <DatePicker
            label="Select Date"
            value={date}
            onChange={setDate}
            maxDate={new Date()}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted">Mark all:</span>
          {STATUS_OPTIONS.map(status => (
            <button
              key={status}
              onClick={() => markAll(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors cursor-pointer
                ${status === "present"
                  ? "border-primary text-primary hover:bg-primary hover:text-white"
                  : status === "absent"
                    ? "border-danger text-danger hover:bg-danger hover:text-white"
                    : "border-warning text-warning hover:bg-warning hover:text-white"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: students.length, text: "text-cyan-600", bg: "bg-cyan-100 dark:bg-cyan-950/30", border: "ring-cyan-600/40" },

          { label: "Present", value: presentCount, text: "text-success", bg: "bg-green-100 dark:bg-green-950/30", border: "ring-green-600/40" },
          
          { label: "Absent", value: absentCount, text: "text-red-600", bg: "bg-red-100 dark:bg-red-950/30", border: "ring-red-600/40" },

          { label: "Late", value: lateCount, text: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", border: "ring-amber-600/40" },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.bg} border-0 ring-1 ${s.border}`}>
            <div className={`stat-value ${s.text}`}>{s.value}</div>
            <div className={`stat-label ${s.text}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Student list */}
      <div className="table-wrapper p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-primary" />
            <span className="text-sm font-semibold text-text">
              {students.length} Students
            </span>
            <span className="text-xs text-muted">
              · {markedCount} marked
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || markedCount === 0}
            className="btn btn-primary text-xs !w-fit disabled:opacity-60 disabled:cursor-not-allowed px-2 py-2 "
          >
            {saving ? (
              <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : saved ? (
              <><CheckCircle size={13} /> Saved</>
            ) : (
                  <><Save size={16} /><span className="hidden sm:inline-flex">Save Attendance</span> </>
            )}
          </button>
        </div>

        <div className="divide-y divide-border">
          {students.map(student => {
            const status = attendance[student.id] ?? null
            return (
              <div
                key={student.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition-colors flex-wrap"
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: "#059669" }}
                >
                  {initials(student.name)}
                </div>

                <div className="flex flex-1 sm:items-center sm:justify-between flex-col sm:flex-row justify-between gap-2">
                  {/* Name + roll */}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2 w-full sm:flex-col sm:items-start sm:gap-0">
                    <p className="text-sm font-medium text-text truncate">{student.name}</p>
                    <p className="text-xs text-muted">Roll {student.roll}</p>
                  </div>

                  {/* Status toggles */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(student.id, s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition-all duration-150 cursor-pointer
                        ${status === s
                            ? statusStyle[s]
                            : "bg-surface text-muted border-border hover:bg-surface-2"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                

              </div>
            )
          })}
        </div>
      </div>

      {/* Save button — bottom */}
      <button
        onClick={handleSave}
        disabled={saving || markedCount === 0}
        className="btn btn-primary w-full justify-center h-11 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (
          <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : saved ? (
          <><CheckCircle size={15} /> Attendance Saved</>
        ) : (
          <><Save size={15} /> Save Attendance for {date}</>
        )}
      </button>

    </div>
  )
}