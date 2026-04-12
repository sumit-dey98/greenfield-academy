'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import {
  ChevronDown, Save,
  CheckCircle, CalendarCheck, Users,
} from "lucide-react"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"

const STATUS_OPTIONS = ["present", "absent", "late"]

const statusStyle = {
  present: "bg-primary text-white border-primary",
  absent: "bg-danger text-white border-danger",
  late: "bg-warning text-white border-warning",
}

const statusBadge = {
  present: "badge-success",
  absent: "badge-danger",
  late: "badge-warning",
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

function getMonthRange(monthStr) {
  if (!monthStr) return { start: null, end: null }
  const [y, m] = monthStr.split("-").map(Number)
  const start = `${y}-${String(m).padStart(2, "0")}-01`
  const end = new Date(y, m, 0).toISOString().split("T")[0]
  return { start, end }
}

export default function AttendanceManager() {
  const { attemptWrite } = useAuth()
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  const [classFilter, setClassFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [expandedClass, setExpandedClass] = useState(null)

  const [markMode, setMarkMode] = useState(false)
  const [markClass, setMarkClass] = useState("")
  const [markDate, setMarkDate] = useState(
    formatDateForDisplay(new Date().toISOString().split("T")[0])
  )
  const [markMap, setMarkMap] = useState({})
  const [existingMap, setExistingMap] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchAll = async () => {
    const { start, end } = getMonthRange(monthFilter)
    const [classesRes, studentsRes, attendanceRes] = await Promise.all([
      supabase.from("classes").select("*").order("grade", { ascending: true }),
      supabase.from("students").select("*").order("roll", { ascending: true }),
      supabase.from("attendance").select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .range(0, 9999),
    ])
    if (classesRes.data) setClasses(classesRes.data)
    if (studentsRes.data) setStudents(studentsRes.data)
    if (attendanceRes.data) setAttendance(attendanceRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [monthFilter])

  useEffect(() => {
    if (!markMode || !markClass || !markDate) return
    const dbDate = formatDateForDB(markDate)
    const classStudents = students.filter(s => s.class_id === markClass)
    const existing = attendance.filter(a =>
      a.date === dbDate &&
      classStudents.some(s => s.id === a.student_id)
    )
    const attMap = {}
    const exMap = {}
    existing.forEach(a => {
      attMap[a.student_id] = a.status
      exMap[a.student_id] = a.id
    })
    setMarkMap(attMap)
    setExistingMap(exMap)
    setSaved(false)
  }, [markDate, markClass, markMode, students, attendance])

  const getStudentsForClass = (classId) => students.filter(s => s.class_id === classId)
  const getAttendanceForStudent = (studentId) => attendance.filter(a => a.student_id === studentId)
  const initials = (name) => name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  const monthOptions = Array.from({ length: 36 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    return { label, value: val }
  })

  const classOptions = classes.map(c => ({ label: c.name, value: c.id }))
  const visibleClasses = classFilter ? classes.filter(c => c.id === classFilter) : classes

  const setStatus = (studentId, status) => {
    setMarkMap(prev => ({ ...prev, [studentId]: status }))
    setSaved(false)
  }

  const markAll = (status) => {
    const classStudents = students.filter(s => s.class_id === markClass)
    const all = {}
    classStudents.forEach(s => { all[s.id] = status })
    setMarkMap(all)
    setSaved(false)
  }

  const handleMarkAttendance = () => {
    if (!attemptWrite("academic")) return
    setMarkMode(o => !o)
    setSaved(false)
  }

  const handleSaveAttendance = async () => {
    if (!attemptWrite("academic")) return
    setSaving(true)
    const dbDate = formatDateForDB(markDate)
    const classStudents = students.filter(s => s.class_id === markClass)

    const rows = classStudents.map(s => ({
      id: existingMap[s.id] ?? `att_${s.id}_${dbDate}`,
      student_id: s.id,
      date: dbDate,
      status: markMap[s.id] ?? "absent",
    }))

    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,date" })

    setSaving(false)
    if (error) return
    setSaved(true)
    fetchAll()
    setTimeout(() => setSaved(false), 3000)
  }

  const getClassStats = (classId) => {
    const classStudents = getStudentsForClass(classId)
    const classAtt = attendance.filter(a => classStudents.some(s => s.id === a.student_id))
    const present = classAtt.filter(a => a.status === "present").length
    const total = classAtt.length
    return { present, total, rate: total ? Math.round((present / total) * 100) : null }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">View and manage attendance records.</p>
        </div>
        <button
          onClick={handleMarkAttendance}
          className={`btn ${markMode ? "btn-outline" : "btn-primary"}`}
        >
          <CalendarCheck size={15} />
          {markMode ? "Cancel" : "Mark Attendance"}
        </button>
      </div>

      {/* Mark attendance panel */}
      {markMode && (
        <div className="card flex flex-col gap-5 border-2 border-primary">
          <h2 className="font-semibold text-text flex items-center gap-2 text-base">
            <CalendarCheck size={16} className="text-primary" />
            Mark Attendance
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64">
              <Select
                label="Class"
                options={classOptions}
                value={markClass}
                onChange={setMarkClass}
                placeholder="Select class"
                searchable={false}
              />
            </div>
            <div className="w-full sm:w-52">
              <DatePicker
                label="Date"
                value={markDate}
                onChange={setMarkDate}
                maxDate={new Date()}
              />
            </div>
            {markClass && (
              <div className="flex items-end gap-2 flex-wrap">
                <span className="text-xs text-muted mb-2">Mark all:</span>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => markAll(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors cursor-pointer mb-1
                      ${s === "present"
                        ? "border-primary text-primary hover:bg-primary hover:text-white"
                        : s === "absent"
                          ? "border-danger text-danger hover:bg-danger hover:text-white"
                          : "border-warning text-warning hover:bg-warning hover:text-white"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {markClass && (
            <>
              <div className="card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-primary" />
                    <span className="text-sm font-semibold text-text">
                      {students.filter(s => s.class_id === markClass).length} Students
                    </span>
                    <span className="text-xs text-muted">
                      · {Object.keys(markMap).length} marked
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {students.filter(s => s.class_id === markClass).map(student => {
                    const status = markMap[student.id] ?? null
                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "#059669" }}
                        >
                          {initials(student.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{student.name}</p>
                          <p className="text-xs text-muted">Roll {student.roll}</p>
                        </div>
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
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="btn btn-primary disabled:opacity-60"
                >
                  {saving
                    ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    : <><Save size={14} /> Save Attendance for {markDate}</>
                  }
                </button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle size={14} /> Saved
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* View filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-52">
          <Select
            options={[{ label: "All Classes", value: "" }, ...classOptions]}
            value={classFilter}
            onChange={v => { setClassFilter(v); setExpandedClass(null) }}
            placeholder="Filter by class"
            searchable={false}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            options={monthOptions}
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder="Select month"
            searchable={false}
          />
        </div>
      </div>

      {/* Class cards */}
      <div className="flex flex-col gap-4">
        {visibleClasses.map(cls => {
          const classStudents = getStudentsForClass(cls.id)
          const isExpanded = expandedClass === cls.id
          const stats = getClassStats(cls.id)
          const gradeColors = { 9: "#059669", 10: "#0891b2", 11: "#9333ea", 12: "#f59e0b" }
          const color = gradeColors[cls.grade] ?? "#059669"

          return (
            <div key={cls.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-2 transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                  style={{ background: color }}
                >
                  {cls.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text">{cls.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {classStudents.length} students
                    {stats.rate !== null && ` · ${stats.rate}% attendance this month`}
                  </p>
                </div>

                {stats.total > 0 && (
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    {[
                      { label: "Present", value: attendance.filter(a => classStudents.some(s => s.id === a.student_id) && a.status === "present").length, color: "#059669" },
                      { label: "Absent", value: attendance.filter(a => classStudents.some(s => s.id === a.student_id) && a.status === "absent").length, color: "#ef4444" },
                      { label: "Late", value: attendance.filter(a => classStudents.some(s => s.id === a.student_id) && a.status === "late").length, color: "#f59e0b" },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs text-faint">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <ChevronDown
                  size={16}
                  className={`text-faint transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-border max-h-[70vh] overflow-y-auto">
                  {classStudents.length === 0 ? (
                    <p className="text-sm text-muted px-5 py-4">No students in this class.</p>
                  ) : (

                    classStudents.map((student, si) => {
                      const studentAtt = getAttendanceForStudent(student.id)
                      const present = studentAtt.filter(a => a.status === "present").length
                      const absent = studentAtt.filter(a => a.status === "absent").length
                      const late = studentAtt.filter(a => a.status === "late").length
                      const total = studentAtt.length
                      const rate = total ? Math.round((present / total) * 100) : null

                      return (
                        <div
                          key={student.id}
                          className={`border-b border-border last:border-0 ${si % 2 === 0 ? "bg-surface" : "bg-surface-2/30"}`}
                        >
                          <div className="flex items-center gap-4 px-5 py-3">
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: "#059669" }}
                              >
                                {initials(student.name)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text truncate">{student.name}</p>
                              <p className="text-xs text-muted">Roll {student.roll}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {rate !== null && (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${rate}%`,
                                        background: rate >= 75 ? "#059669" : rate >= 50 ? "#f59e0b" : "#ef4444",
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-text">{rate}%</span>
                                </div>
                              )}
                              <div className="hidden sm:flex items-center gap-2 text-xs">
                                <span className="text-success font-medium">{present}P</span>
                                <span className="text-danger font-medium">{absent}A</span>
                                <span className="text-warning font-medium">{late}L</span>
                              </div>
                            </div>
                          </div>

                          {studentAtt.length > 0 && (
                            <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                              {studentAtt.map(record => (
                                <div
                                  key={record.id}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs"
                                  style={{
                                    borderColor: record.status === "present" ? "#05966920" : record.status === "absent" ? "#ef444420" : "#f59e0b20",
                                    background: record.status === "present" ? "#05966910" : record.status === "absent" ? "#ef444410" : "#f59e0b10",
                                  }}
                                >
                                  <span className="text-faint">
                                    {new Date(record.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                  </span>
                                  <span className={`badge h- w-5 rounded-full flex items-center justify-center  ${statusBadge[record.status]} text-xs py-0`}>
                                    {record.status.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {studentAtt.length === 0 && (
                            <p className="text-xs text-faint px-5 pb-3">No records this month.</p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}