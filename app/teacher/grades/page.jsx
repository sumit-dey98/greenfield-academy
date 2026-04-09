'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Save, CheckCircle, ChevronDown, BookOpen, AlertTriangle, Lock } from "lucide-react"
import ExamResultsChart from "@/components/teacher/ExamResultsChart"
import Select from "@/components/ui/Select"
import { calcGrade, calcRemarks } from "@/lib/services/grading"

export default function TeacherGradesPage() {
  const { user } = useAuth()

  const [exams, setExams] = useState([])
  const [schedule, setSchedule] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedExam, setSelectedExam] = useState("")
  const [expandedClass, setExpandedClass] = useState(null)
  const selectedExamData = exams.find(e => e.id === selectedExam)
  const examStatus = selectedExamData?.status

  // marks map: { [studentId_subjectId]: marks }
  const [marksMap, setMarksMap] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingClass, setSavingClass] = useState(null)

  useEffect(() => {
    if (!user) return
    const fetchAll = async () => {
      const [examsRes, scheduleRes, studentsRes, classesRes, subjectsRes] = await Promise.all([
        supabase.from("exams").select("*").order("start_date", { ascending: true }),
        supabase.from("schedule").select("*, subjects(id,name)").eq("teacher_id", user.id),
        supabase.from("students").select("*").order("roll", { ascending: true }),
        supabase.from("classes").select("*"),
        supabase.from("subjects").select("*"),
      ])
      if (examsRes.data) setExams(examsRes.data)
      if (scheduleRes.data) setSchedule(scheduleRes.data)
      if (studentsRes.data) setStudents(studentsRes.data)
      if (classesRes.data) setClasses(classesRes.data)
      if (subjectsRes.data) setSubjects(subjectsRes.data)
      setLoading(false)
    }
    fetchAll()
  }, [user])

  useEffect(() => {
    if (exams.length === 0) return
    // find latest grading exam first, then latest ended
    const grading = exams.find(e => e.status === "grading")
    const ended = [...exams]
      .filter(e => e.status === "ended")
      .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0]
    const auto = grading ?? ended
    if (auto) setSelectedExam(auto.id)
  }, [exams])

  // Derive unique class+subject combos this teacher teaches
  const teachingSlots = schedule.reduce((acc, slot) => {
    const key = `${slot.class_id}_${slot.subject_id}`
    if (!acc.find(s => s.key === key)) {
      acc.push({
        key,
        class_id: slot.class_id,
        subject_id: slot.subject_id,
        subject_name: slot.subjects?.name,
      })
    }
    return acc
  }, [])

  // Group by class
  const classSlotsMap = teachingSlots.reduce((acc, slot) => {
    if (!acc[slot.class_id]) acc[slot.class_id] = []
    acc[slot.class_id].push(slot)
    return acc
  }, {})

  const getClassName = (id) => classes.find(c => c.id === id)?.name ?? id
  const getStudents = (classId) => students.filter(s => s.class_id === classId)
  const initials = (name) => name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  const markKey = (studentId, subjectId) => `${studentId}_${subjectId}`

  const setMark = (studentId, subjectId, val) => {
    setMarksMap(prev => ({ ...prev, [markKey(studentId, subjectId)]: val }))
    setSaved(false)
  }

  const loadExistingMarks = async (classId) => {
    if (!selectedExam) return
    const classStudents = getStudents(classId)
    const slots = classSlotsMap[classId] ?? []
    const subjectIds = slots.map(s => s.subject_id)
    const studentIds = classStudents.map(s => s.id)
    const examName = exams.find(e => e.id === selectedExam)?.name

    if (!examName || studentIds.length === 0 || subjectIds.length === 0) return

    const { data: existing } = await supabase
      .from("results")
      .select("student_id, subject_id, marks")
      .in("student_id", studentIds)
      .in("subject_id", subjectIds)
      .eq("exam", examName)

    if (existing) {
      const loaded = {}
      existing.forEach(r => {
        loaded[markKey(r.student_id, r.subject_id)] = String(r.marks)
      })
      setMarksMap(prev => ({ ...prev, ...loaded }))
    }
  }

  const handleExpandClass = async (classId) => {
    if (expandedClass === classId) { setExpandedClass(null); return }
    setExpandedClass(classId)
    await loadExistingMarks(classId)
  }

  const handleSaveClass = async (classId) => {
    if (!selectedExam) return
    setSavingClass(classId)

    const examName = exams.find(e => e.id === selectedExam)?.name
    const classStudents = getStudents(classId)
    const slots = classSlotsMap[classId] ?? []

    const rows = []
    classStudents.forEach(student => {
      slots.forEach(slot => {
        const raw = marksMap[markKey(student.id, slot.subject_id)]
        if (raw === undefined || raw === "") return
        const marks = Number(raw)
        if (isNaN(marks) || marks < 0 || marks > 100) return
        const grade = calcGrade(marks)
        const remarks = calcRemarks(grade)
        rows.push({
          id: `res_${student.id}_${slot.subject_id}_${selectedExam}`,
          student_id: student.id,
          subject_id: slot.subject_id,
          exam: examName,
          marks,
          total: 100,
          grade,
          remarks,
        })
      })
    })

    if (rows.length > 0) {
      await supabase
        .from("results")
        .upsert(rows, { onConflict: "student_id,subject_id,exam" })
    }

    setSavingClass(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const examOptions = exams.map(e => ({ label: `${e.name} (${e.status})`, value: e.id }))
  const classIds = Object.keys(classSlotsMap)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Grade Entry</h1>
        <p className="page-subtitle">Enter marks for your classes by exam.</p>
      </div>

      <ExamResultsChart examIds={[selectedExam]} />

      {/* Exam selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="w-full sm:w-72">
          <Select
            label="Select Exam"
            options={examOptions}
            value={selectedExam}
            onChange={v => { setSelectedExam(v); setExpandedClass(null); setMarksMap({}) }}
            placeholder="Select an exam"
            searchable={false}
          />
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success pb-1">
            <CheckCircle size={14} /> Marks saved successfully.
          </span>
        )}
      </div>

      {!selectedExam && (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <BookOpen size={36} className="text-faint" />
          <p className="text-muted text-sm">Select the exam to enter marks.</p>
        </div>
      )}

      {selectedExam && examStatus === "upcoming" && (
        <div className="flex items-center gap-3 px-5 py-4 bg-surface border border-warning rounded-lg">
          <AlertTriangle size={16} className="text-warning shrink-0" />
          <p className="text-sm text-text">
            This exam is <strong>upcoming</strong> — grade entry is not open yet.
          </p>
        </div>
      )}

      {selectedExam && examStatus === "ended" && (
        <div className="flex items-center gap-3 px-5 py-4 bg-surface border border-border rounded-lg">
          <Lock size={16} className="text-faint shrink-0" />
          <p className="text-sm text-muted">
            This exam has <strong>ended</strong> — grades are locked and cannot be edited.
          </p>
        </div>
      )}

      {/* Class cards */}
      {selectedExam && classIds.length === 0 && (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <BookOpen size={36} className="text-faint" />
          <p className="text-muted text-sm">You are not assigned to teach any classes.</p>
        </div>
      )}

      {selectedExam && classIds.map(classId => {
        const slots = classSlotsMap[classId]
        const classStudents = getStudents(classId)
        const isExpanded = expandedClass === classId
        const className = getClassName(classId)

        const gradeColors = { 9: "#059669", 10: "#0891b2", 11: "#9333ea", 12: "#f59e0b" }
        const cls = classes.find(c => c.id === classId)
        const color = gradeColors[cls?.grade] ?? "#059669"

        return (
          <div key={classId} className="card p-0 overflow-hidden">

            {/* Class header */}
            <button
              onClick={() => handleExpandClass(classId)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-2 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: color }}
              >
                {cls?.grade}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">{className}</p>
                <p className="text-xs text-muted mt-0.5">
                  {classStudents.length} students ·{" "}
                  {slots.map(s => s.subject_name).join(", ")}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-faint transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {/* Expanded grade entry */}
            {isExpanded && (
              <div className="border-t border-border">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: "500px" }}>
                    <thead>
                      <tr className="border-b border-border bg-surface-2">
                        <th className="text-left px-6 py-3 text-text font-semibold w-20">Roll</th>
                        <th className="text-left px-5 py-3 text-text font-semibold w-full">Student</th>

                        {slots.map(slot => (
                          <th key={slot.subject_id} className="text-left px-3 py-3 text-text ">
                            Marks
                            <span className="text-faint font-normal ml-1">/100</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student, si) => (
                        <tr
                          key={student.id}
                          className={`border-b border-border last:border-0 ${si % 2 === 0 ? "bg-surface" : "bg-surface-2/30"}`}
                        >        <td className="px-6 py-3">
                            <span className="text-sm text-muted">{student.roll}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: color }}
                              >
                                {initials(student.name)}
                              </div>
                              <span className="text-sm font-medium text-text truncate">{student.name}</span>
                            </div>
                          </td>

                          {slots.map(slot => {
                            const key = markKey(student.id, slot.subject_id)
                            const val = marksMap[key] ?? ""
                            const num = Number(val)
                            const valid = val !== "" && !isNaN(num) && num >= 0 && num <= 100
                            const grade = valid ? calcGrade(num) : null
                            return (
                              <td key={slot.subject_id} className="px-3 py-2">
                                <div className="flex items-center gap-4">
                                  <input
                                    disabled={examStatus !== "grading"}
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={val}
                                    onChange={e => setMark(student.id, slot.subject_id, e.target.value)}
                                    placeholder="—"
                                    className={`input w-20 h-8 text-sm text-center ${val !== "" && !valid ? "border-danger" : ""
                                      }`}
                                  />
                                  {grade && (
                                    <span className={`badge text-xs ${num >= 70 ? "badge-success" :
                                      num >= 50 ? "badge-info" :
                                        num >= 33 ? "badge-warning" : "badge-danger"
                                      }`}>
                                      {grade}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Save row */}
                {examStatus === "grading" && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-2 flex-wrap gap-2">
                    <p className="text-xs text-muted">
                      Saving will overwrite any existing marks for this exam.
                    </p>
                    <button
                      onClick={() => handleSaveClass(classId)}
                      disabled={savingClass === classId}
                      className="btn btn-primary text-xs disabled:opacity-60"
                    >
                      {savingClass === classId
                        ? <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        : <><Save size={13} /> Save Marks</>
                      }
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}