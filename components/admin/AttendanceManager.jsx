'use client'

import { useEffect, useState } from "react"
import { listAttendance, markAttendance } from "@/lib/api/attendance"
import { listClasses } from "@/lib/api/classes"
import { listStudents } from "@/lib/api/adminPeople"
import { listCounts } from "@/lib/api/counts"
import { useAuth } from "@/context/AuthContext"
import {
  ChevronDown, Save,
  CheckCircle, CalendarCheck, Users,
} from "lucide-react"
import LoadingState from "../ui/LoadingState"
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

// Fetch every student of one class (a class roster is small, but page through in case
// it somehow exceeds the per-request cap).
async function fetchClassStudents(classId) {
  const out = []
  let offset = 0
  const limit = 200
  for (;;) {
    const page = await listStudents({ class_id: classId, limit, offset })
    const items = page?.items ?? []
    out.push(...items)
    if (items.length < limit || out.length >= (page?.total ?? out.length)) break
    offset += limit
  }
  return out
}

export default function AttendanceManager() {
  const { attemptWrite } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  const [classFilter, setClassFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [expandedClass, setExpandedClass] = useState(null)
  // Per-class data, fetched lazily on expand and keyed by class id:
  //   classData[classId] = { students: [...], attendance: [...] }
  const [classData, setClassData] = useState({})
  const [loadingClass, setLoadingClass] = useState(null)
  // Present/absent/late for every class in the selected month, from the pre-aggregated
  // /admin/counts endpoint — one call covers every card's summary, no roster fetch needed.
  const [monthCounts, setMonthCounts] = useState({})
  // Student count per class (doesn't change with the month) — one cheap limit:1 call per
  // class, read from Page.total rather than fetching full rosters up front.
  const [studentCounts, setStudentCounts] = useState({})

  const [markMode, setMarkMode] = useState(false)
  const [markClass, setMarkClass] = useState("")
  const [markStudents, setMarkStudents] = useState([])
  const [markDate, setMarkDate] = useState(
    formatDateForDisplay(new Date().toISOString().split("T")[0])
  )
  const [markMap, setMarkMap] = useState({})
  const [existingMap, setExistingMap] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    listClasses()
      .then(data => setClasses(data ?? []))
      .catch(err => console.error("Failed to load classes:", err))
      .finally(() => setLoading(false))

    // Every class's roster size, in one call — a student_count row per class, kept in
    // sync on student create/delete/class-transfer (see utils.apply_student_count_delta).
    listCounts({ scope_type: "class", metric: "student_count", limit: 200 })
      .then(page => {
        const byClass = Object.fromEntries((page?.items ?? []).map(r => [r.scope_id, r.value]))
        setStudentCounts(byClass)
      })
      .catch(err => console.error("Failed to load student counts:", err))
  }, [])

  // Every class's present/absent/late for the selected month, in one call — drives the
  // collapsed card summaries without fetching any roster/attendance rows up front.
  const loadMonthCounts = async () => {
    try {
      const page = await listCounts({ scope_type: "class", period_type: "month", period_key: monthFilter, limit: 200 })
      const byClass = {}
      ;(page?.items ?? []).forEach(r => {
        const bucket = byClass[r.scope_id] ??= { present: 0, absent: 0, late: 0, excused: 0 }
        const status = r.metric.replace("attendance_", "")
        if (status in bucket) bucket[status] = r.value
      })
      setMonthCounts(byClass)
    } catch (err) {
      console.error("Failed to load attendance counts:", err)
    }
  }

  useEffect(() => {
    loadMonthCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter])

  // Load one class's roster + this month's attendance (used by the expandable cards).
  const loadClassData = async (classId) => {
    const { start, end } = getMonthRange(monthFilter)
    setLoadingClass(classId)
    try {
      const [students, attendancePage] = await Promise.all([
        fetchClassStudents(classId),
        listAttendance({ class_id: classId, from_date: start, to_date: end, limit: 2000 }),
      ])
      setClassData(prev => ({
        ...prev,
        [classId]: { students, attendance: attendancePage?.items ?? [] },
      }))
    } catch (err) {
      console.error("Failed to load class attendance:", err)
    } finally {
      setLoadingClass(null)
    }
  }

  // Changing the month invalidates any already-loaded class data; drop the cache and
  // re-fetch whichever class is currently expanded.
  useEffect(() => {
    setClassData({})
    if (expandedClass) loadClassData(expandedClass)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter])

  const toggleClass = (classId) => {
    const next = expandedClass === classId ? null : classId
    setExpandedClass(next)
    if (next && !classData[next]) loadClassData(next)
  }

  // Mark panel: load the chosen class's roster once a class is picked.
  useEffect(() => {
    if (!markMode || !markClass) { setMarkStudents([]); return }
    let cancelled = false
    fetchClassStudents(markClass)
      .then(list => { if (!cancelled) setMarkStudents(list) })
      .catch(err => console.error("Failed to load class roster:", err))
    return () => { cancelled = true }
  }, [markClass, markMode])

  // Mark panel: prefill existing marks for the chosen class + date.
  useEffect(() => {
    if (!markMode || !markClass || !markDate) return
    const dbDate = formatDateForDB(markDate)
    let cancelled = false
    listAttendance({ class_id: markClass, from_date: dbDate, to_date: dbDate, limit: 2000 })
      .then(page => {
        if (cancelled) return
        const attMap = {}
        const exMap = {}
        ;(page?.items ?? []).forEach(a => {
          attMap[a.student_id] = a.status
          exMap[a.student_id] = a.id
        })
        setMarkMap(attMap)
        setExistingMap(exMap)
        setSaved(false)
      })
      .catch(err => console.error("Failed to load existing marks:", err))
    return () => { cancelled = true }
  }, [markDate, markClass, markMode])

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
    const all = {}
    markStudents.forEach(s => { all[s.id] = status })
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

    const records = markStudents.map(s => ({
      student_id: s.id,
      status: markMap[s.id] ?? "absent",
    }))

    try {
      await markAttendance({ date: dbDate, records })
      setSaved(true)
      // Refresh the expanded card if it's the class we just marked.
      if (expandedClass === markClass) {
        setClassData(prev => { const n = { ...prev }; delete n[markClass]; return n })
        loadClassData(markClass)
      }
      // The counts backing every collapsed card just changed for this month.
      if (dbDate.slice(0, 7) === monthFilter) loadMonthCounts()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save attendance:", err)
    } finally {
      setSaving(false)
    }
  }

  const getClassStats = (classId) => {
    const c = monthCounts[classId]
    if (!c) return { present: 0, absent: 0, late: 0, total: 0, rate: null }
    const total = c.present + c.absent + c.late + c.excused
    return {
      present: c.present, absent: c.absent, late: c.late, total,
      rate: total ? Math.round((c.present / total) * 100) : null,
    }
  }

  if (loading) return <LoadingState label="Loading..." />

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
                      {markStudents.length} Students
                    </span>
                    <span className="text-xs text-muted">
                      · {Object.keys(markMap).length} marked
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {markStudents.map(student => {
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
          const data = classData[cls.id]
          const classStudents = data?.students ?? []
          const classAttendance = data?.attendance ?? []
          const isExpanded = expandedClass === cls.id
          const isClassLoading = loadingClass === cls.id
          const stats = getClassStats(cls.id)
          const gradeColors = { 9: "#059669", 10: "#0891b2", 11: "#9333ea", 12: "#f59e0b" }
          const color = gradeColors[cls.grade] ?? "#059669"

          return (
            <div key={cls.id} className="table-wrapper p-0 overflow-hidden">
              <button
                onClick={() => toggleClass(cls.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 bg-surface hover:bg-surface-2 transition-colors text-left ${isExpanded ? "bg-surface-2" : ""}`}
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
                    {studentCounts[cls.id] ?? "…"} students
                    {stats.rate !== null
                      ? ` · ${stats.rate}% attendance this month`
                      : " · no attendance marked yet this month"}
                  </p>
                </div>

                {stats.total > 0 && (
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    {[
                      { label: "Present", value: stats.present, color: "#059669" },
                      { label: "Absent", value: stats.absent, color: "#ef4444" },
                      { label: "Late", value: stats.late, color: "#f59e0b" },
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
                  {isClassLoading || !data ? (
                    <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-muted">
                      <span className="w-4 h-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                      Loading attendance…
                    </div>
                  ) : classStudents.length === 0 ? (
                    <p className="text-sm text-muted px-5 py-4">No students in this class.</p>
                  ) : (

                    classStudents.map((student, si) => {
                      const studentAtt = classAttendance.filter(a => a.student_id === student.id)
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