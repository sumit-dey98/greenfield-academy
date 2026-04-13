'use client'

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import {
  Plus, Pencil, Trash2,
  Save, AlertCircle, CheckCircle, ChevronDown, ChevronRight,
} from "lucide-react"
import SearchBox from "@/components/ui/SearchBox"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { calcGrade, calcRemarks, gradeColor } from "@/lib/services/grading"

const COLORS = { primary: "#059669", info: "#0891b2", danger: "#ef4444", warning: "#f59e0b" }
const emptyForm = { class_id: "", student_id: "", subject_id: "", exam_id: "", marks: "" }
const gradeColors = { 9: "#059669", 10: "#0891b2", 11: "#9333ea", 12: "#f59e0b" }

const statusBadge = {
  upcoming: "badge-info",
  grading: "badge-success",
  ended: "badge-warning",
}

export default function ResultsManager() {
  const { attemptWrite } = useAuth()

  // Base data
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [exams, setExams] = useState([])

  // Filters
  const [classFilter, setClassFilter] = useState("")
  const [examFilter, setExamFilter] = useState("")

  // Lazy results cache: { [classId_examId]: result[] }
  const [resultsCache, setResultsCache] = useState({})

  // Total count for subtitle (filtered by exam)
  const [totalCount, setTotalCount] = useState(0)

  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  // Class modal
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [expandedStudent, setExpandedStudent] = useState(null)
  const [modalResults, setModalResults] = useState([])
  const [modalResultsLoading, setModalResultsLoading] = useState(false)

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("add")
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formStudents, setFormStudents] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const [classesRes, studentsRes, subjectsRes, examsRes] = await Promise.all([
        supabase.from("classes").select("*").order("grade", { ascending: true }),
        supabase.from("students").select("id, name, roll, class_id").order("roll", { ascending: true }),
        supabase.from("subjects").select("*").order("name", { ascending: true }),
        supabase.from("exams").select("*").order("start_date", { ascending: false }),
      ])

      const classesData = classesRes.data ?? []
      const studentsData = studentsRes.data ?? []
      const subjectsData = subjectsRes.data ?? []
      const examsData = examsRes.data ?? []

      setClasses(classesData)
      setStudents(studentsData)
      setSubjects(subjectsData)
      setExams(examsData)

      // Find latest exam with results
      if (examsData.length > 0) {
        const { data: examCounts } = await supabase
          .from("results")
          .select("exam_id")
          .in("exam_id", examsData.map(e => e.id))

        const examIdsWithResults = new Set((examCounts ?? []).map(r => r.exam_id))
        const latestExam = examsData.find(e => examIdsWithResults.has(e.id))
        if (latestExam) setExamFilter(latestExam.id)
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── Total count for subtitle ──────────────────────────────
  useEffect(() => {
    if (!examFilter) { setTotalCount(0); return }
    const fetchCount = async () => {
      const { count } = await supabase
        .from("results")
        .select("*", { count: "exact", head: true })
        .eq("exam_id", examFilter)
      setTotalCount(count ?? 0)
    }
    fetchCount()
  }, [examFilter])

  // ── Exams that have results ───────────────────────────────
  const [examsWithResults, setExamsWithResults] = useState([])
  useEffect(() => {
    if (exams.length === 0) return
    const fetchExamsWithResults = async () => {
      const { data } = await supabase
        .from("results")
        .select("exam_id")
        .in("exam_id", exams.map(e => e.id))
      const ids = new Set((data ?? []).map(r => r.exam_id))
      setExamsWithResults(exams.filter(e => ids.has(e.id)))
    }
    fetchExamsWithResults()
  }, [exams])

  const examFilterOptions = examsWithResults.map(e => ({
    label: e.name,
    value: e.id,
  }))

  const examOptions = exams.map(e => ({ label: e.name, value: e.id }))

  // ── Lazy load results for a class ─────────────────────────
  const loadResultsForClass = useCallback(async (cls) => {
    if (!examFilter) return []
    const cacheKey = `${cls.id}_${examFilter}`
    if (resultsCache[cacheKey]) return resultsCache[cacheKey]

    setModalResultsLoading(true)
    const classStudentIds = students
      .filter(s => s.class_id === cls.id)
      .map(s => s.id)

    if (classStudentIds.length === 0) {
      setModalResultsLoading(false)
      return []
    }

    const { data } = await supabase
      .from("results")
      .select("*, exam_id, subjects(name, code), exams(name, status)")
      .in("student_id", classStudentIds)
      .eq("exam_id", examFilter)
      .order("student_id", { ascending: true })
      .range(0, 9999)

    const results = data ?? []
    setResultsCache(prev => ({ ...prev, [cacheKey]: results }))
    setModalResultsLoading(false)
    return results
  }, [examFilter, students, resultsCache])

  const openClassModal = async (cls) => {
    setSelectedClass(cls)
    setExpandedStudent(null)
    setSearch("")
    const results = await loadResultsForClass(cls)
    setModalResults(results)
    setClassModalOpen(true)
  }

  // Refresh modal results after add/edit/delete
  const refreshModalResults = async () => {
    if (!selectedClass || !examFilter) return
    const cacheKey = `${selectedClass.id}_${examFilter}`
    setModalResultsLoading(true)
    const classStudentIds = students
      .filter(s => s.class_id === selectedClass.id)
      .map(s => s.id)
    const { data } = await supabase
      .from("results")
      .select("*, exam_id, subjects(name, code), exams(name, status)")
      .in("student_id", classStudentIds)
      .eq("exam_id", examFilter)
      .order("student_id", { ascending: true })
    const results = data ?? []
    setResultsCache(prev => ({ ...prev, [cacheKey]: results }))
    setModalResults(results)
    setModalResultsLoading(false)

    // Refresh total count
    const { count } = await supabase
      .from("results")
      .select("*", { count: "exact", head: true })
      .eq("exam_id", examFilter)
    setTotalCount(count ?? 0)
  }

  const getStudentsForClass = (classId) => students.filter(s => s.class_id === classId)

  const getResultsForStudent = (studentId) => {
    let r = modalResults.filter(r => r.student_id === studentId)
    if (search) r = r.filter(x =>
      x.subjects?.name?.toLowerCase().includes(search.toLowerCase())
    )
    return r
  }

  const initials = (name) => name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  // ── Form ──────────────────────────────────────────────────
  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  // Load students when class changes in form
  useEffect(() => {
    if (!form.class_id) { setFormStudents([]); return }
    setFormStudents(students.filter(s => s.class_id === form.class_id))
    // Reset student if class changed
    setForm(f => ({ ...f, student_id: "" }))
  }, [form.class_id, students])

  const validate = () => {
    const e = {}
    if (!form.class_id) e.class_id = "Class is required."
    if (!form.student_id) e.student_id = "Student is required."
    if (!form.subject_id) e.subject_id = "Subject is required."
    if (!form.exam_id) e.exam_id = "Exam is required."
    if (form.marks === "" || form.marks === undefined) e.marks = "Marks is required."
    if (Number(form.marks) < 0 || Number(form.marks) > 100) e.marks = "Marks must be 0–100."
    return e
  }

  const openAdd = (studentId = "") => {
    if (!attemptWrite("academic")) return
    const defaultClassId = classFilter || classes[0]?.id || ""
    setModalMode("add")
    setEditingId(null)
    setForm({
      ...emptyForm,
      class_id: defaultClassId,
      student_id: studentId,
      exam_id: examFilter,
    })
    setErrors({})
    setSaved(false)
    setModalOpen(true)
  }

  const openEdit = (result) => {
    if (!attemptWrite("academic")) return
    const student = students.find(s => s.id === result.student_id)
    setModalMode("edit")
    setEditingId(result.id)
    setForm({
      class_id: student?.class_id ?? "",
      student_id: result.student_id,
      subject_id: result.subject_id,
      exam_id: result.exam_id,
      marks: result.marks,
    })
    setErrors({})
    setSaved(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    const marks = Number(form.marks)
    const grade = calcGrade(marks)
    const remarks = calcRemarks(grade)
    const examName = exams.find(e => e.id === form.exam_id)?.name ?? ""

    const payload = {
      student_id: form.student_id,
      subject_id: form.subject_id,
      exam_id: form.exam_id,
      exam: examName,
      marks, total: 100, grade, remarks,
    }

    let error
    if (modalMode === "edit") {
      const res = await supabase.from("results").update(payload).eq("id", editingId)
      error = res.error
    } else {
      const id = `res_${Date.now()}`
      const res = await supabase.from("results").insert({ id, ...payload })
      error = res.error
    }

    setSaving(false)
    if (error) { setModalOpen(false); return }
    setSaved(true)
    setModalOpen(false)
    refreshModalResults()
    setTimeout(() => setSaved(false), 3000)
  }

  const openConfirmDelete = (result) => {
    if (!attemptWrite("academic")) return
    setDeleteTarget(result)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from("results").delete().eq("id", deleteTarget.id)
    setDeleting(false)
    setConfirmOpen(false)
    setDeleteTarget(null)
    refreshModalResults()
  }

  const visibleClasses = classFilter
    ? classes.filter(c => c.id === classFilter)
    : classes

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="page-subtitle">
            {examFilter
              ? `${totalCount} entries · ${exams.find(e => e.id === examFilter)?.name}`
              : "Select an exam to view results"
            }
          </p>
        </div>
        <button onClick={() => openAdd()} className="btn btn-primary">
          <Plus size={15} /> Add Result
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success rounded-lg text-sm text-success font-medium">
          <CheckCircle size={15} />
          Result {modalMode === "add" ? "added" : "updated"} successfully.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="w-full sm:w-52">
          <Select
            options={[{ label: "All Classes", value: "" }, ...classes.map(c => ({ label: c.name, value: c.id }))]}
            value={classFilter}
            onChange={v => setClassFilter(v)}
            placeholder="Filter by class"
            searchable={false}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            options={examFilterOptions}
            value={examFilter}
            onChange={v => setExamFilter(v)}
            placeholder="Select exam"
            searchable={false}
            clearable={false}
          />
        </div>
      </div>

      {/* Class cards */}
      <div className="flex flex-col gap-4">
        {visibleClasses.map(cls => {
          const classStudents = getStudentsForClass(cls.id)
          const color = gradeColors[cls.grade] ?? "#059669"
          return (
            <button
              key={cls.id}
              onClick={() => openClassModal(cls)}
              className="card shadow-hover flex items-center gap-4 text-left hover:bg-surface-2 transition-colors duration-200 cursor-pointer w-full"
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ background: color }}
              >
                {cls.grade}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">{cls.name}</p>
                <p className="text-xs text-muted mt-0.5">
                  {classStudents.length} students
                </p>
              </div>
              <ChevronRight size={16} className="text-faint shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Class Modal */}
      <Modal
        open={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title={selectedClass ? `${selectedClass.name} — ${exams.find(e => e.id === examFilter)?.name ?? ""}` : ""}
        width="max-w-6xl"
      >
        {selectedClass && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted shrink-0">{modalResults.length} entries</p>
              <div className="w-full sm:w-72">
                <SearchBox
                  placeholder="Search subject..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onClear={() => setSearch("")}
                />
              </div>
            </div>

            {modalResultsLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="w-5 h-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {getStudentsForClass(selectedClass.id).length === 0 ? (
                  <p className="text-sm text-muted py-4">No students in this class.</p>
                ) : (
                  getStudentsForClass(selectedClass.id).map(student => {
                    const studentResults = getResultsForStudent(student.id)
                    const isOpen = expandedStudent === student.id
                    const avgMarks = studentResults.length
                      ? Math.round(studentResults.reduce((s, r) => s + r.marks, 0) / studentResults.length)
                      : null

                    return (
                      <div key={student.id} className="table-wrapper">
                        {/* Accordion header */}
                        <div
                          onClick={() => setExpandedStudent(isOpen ? null : student.id)}
                          className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 transition-colors cursor-pointer select-none ${isOpen ? "bg-surface-2" : "bg-surface hover:bg-surface-2"}`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: COLORS.primary }}
                          >
                            {initials(student.name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">{student.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-muted">Roll {student.roll}</p>
                              {/* Mobile avg — shown inline under name */}
                              {avgMarks !== null && (
                                <span
                                  className="sm:hidden text-xs font-bold"
                                  style={{ color: avgMarks >= 70 ? COLORS.primary : avgMarks >= 50 ? COLORS.info : COLORS.danger }}
                                >
                                  · {avgMarks}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Desktop avg bar */}
                          {avgMarks !== null && (
                            <div className="hidden sm:flex items-center gap-2 shrink-0">
                              <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${avgMarks}%`,
                                    background: avgMarks >= 70 ? COLORS.primary : avgMarks >= 50 ? COLORS.info : COLORS.danger,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-text w-8">{avgMarks}%</span>
                            </div>
                          )}

                          <button
                            onClick={e => { e.stopPropagation(); openAdd(student.id) }}
                            className="btn btn-primary text-xs shrink-0 py-1 px-2 w-fit"
                          >
                            <Plus size={12} />
                            <span className="hidden sm:inline">Add</span>
                          </button>

                          <ChevronDown
                            size={15}
                            className={`text-faint transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>

                        {/* Expanded results */}
                        {isOpen && (
                          <div className="border-t border-border bg-bg">
                            {studentResults.length === 0 ? (
                              <p className="text-xs text-faint py-4 px-4">No results recorded.</p>
                            ) : (
                              <div className="max-h-96 overflow-y-auto overflow-x-auto">
                                <table className="w-full text-sm border-collapse min-w-[480px]">
                                  <thead className="sticky top-0 z-10 bg-surface-2 border-b border-border">
                                    <tr>
                                      <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Subject</th>
                                      <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Marks</th>
                                      <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Grade</th>
                                      <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Remarks</th>
                                        <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell" > Action </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {studentResults.map(result => (
                                      <tr key={result.id} className="hover:bg-surface transition-colors duration-100 group">
                                        <td className="px-3 sm:px-4 py-3 font-semibold text-text text-xs">{result.subjects?.name}</td>
                                        <td className="px-3 sm:px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-12 sm:w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden shrink-0">
                                              <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                  width: `${result.marks}%`,
                                                  background: result.marks >= 70 ? COLORS.primary : result.marks >= 50 ? COLORS.info : COLORS.danger,
                                                }}
                                              />
                                            </div>
                                            <span
                                              className="text-xs font-bold tabular-nums"
                                              style={{ color: result.marks >= 70 ? COLORS.primary : result.marks >= 50 ? COLORS.info : COLORS.danger }}
                                            >
                                              {result.marks}<span className="text-faint font-normal">/100</span>
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3">
                                          <span className={`badge ${gradeColor[result.grade] ?? "badge-info"}`}>
                                            {result.grade}
                                          </span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-xs text-muted hidden sm:table-cell">{result.remarks}</td>
                                        <td className="px-3 sm:px-4 py-3">
                                          <div className="flex items-center gap-1  transition-opacity duration-150">
                                            <button
                                              onClick={() => openEdit(result)}
                                              className="p-1.5 rounded-md hover:bg-surface-2 text-faint hover:text-text transition-colors"
                                            >
                                              <Pencil size={13} />
                                            </button>
                                            <button
                                              onClick={() => openConfirmDelete(result)}
                                              className="p-1.5 rounded-md hover:bg-surface-2 text-faint hover:text-danger transition-colors"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "add" ? "Add Result" : "Edit Result"}
        width="max-w-xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Class"
              required
              options={classes.map(c => ({ label: c.name, value: c.id }))}
              value={form.class_id}
              onChange={v => setField("class_id", v)}
              error={errors.class_id}
              placeholder="Select class"
              searchable={false}
            />
            <Select
              label="Exam"
              required
              options={examOptions}
              value={form.exam_id}
              onChange={v => setField("exam_id", v)}
              error={errors.exam_id}
              placeholder="Select exam"
              searchable={false}
              clearable={false}
            />
            <div className="sm:col-span-2">
              <Select
                label="Student"
                required
                options={formStudents.map(s => ({ label: `${s.name} (Roll ${s.roll})`, value: s.id }))}
                value={form.student_id}
                onChange={v => setField("student_id", v)}
                error={errors.student_id}
                placeholder={form.class_id ? "Select student" : "Select a class first"}
                disabled={!form.class_id}
              />
            </div>
            <Select
              label="Subject"
              required
              options={subjects.map(s => ({ label: s.name, value: s.id }))}
              value={form.subject_id}
              onChange={v => setField("subject_id", v)}
              error={errors.subject_id}
              placeholder="Select subject"
            />
            <Input
              label="Marks (out of 100)"
              required
              type="number"
              value={form.marks}
              onChange={e => setField("marks", e.target.value)}
              error={errors.marks}
              placeholder="0 – 100"
              hint={
                form.marks !== "" && !isNaN(Number(form.marks))
                  ? `Grade: ${calcGrade(Number(form.marks))} · ${calcRemarks(calcGrade(Number(form.marks)))}`
                  : "Grade will be calculated automatically"
              }
            />
          </div>

          {form.marks !== "" && !isNaN(Number(form.marks)) && (
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 rounded-lg border border-border">
              <span className="text-sm text-muted">Calculated grade:</span>
              <span className={`badge ${gradeColor[calcGrade(Number(form.marks))] ?? "badge-info"}`}>
                {calcGrade(Number(form.marks))}
              </span>
              <span className="text-sm text-muted">
                — {calcRemarks(calcGrade(Number(form.marks)))}
              </span>
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 text-xs text-danger">
              <AlertCircle size={13} className="shrink-0" />
              Please fix the errors above.
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-border">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><Save size={14} /> {modalMode === "add" ? "Add Result" : "Save"}</>
              }
            </button>
            <button onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null) }}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Result"
        message="Delete this result entry? This cannot be undone."
        confirmLabel="Delete Result"
      />

    </div>
  )
}