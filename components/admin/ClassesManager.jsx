'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { BookOpen, Users, Save, CheckCircle, Plus, Trash2, AlertCircle, Pencil } from "lucide-react"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

const GRADES = ["9", "10", "11", "12"]

const emptyForm = { name: "", grade: "", section: "", room: "", teacher_id: "" }

export default function ClassesManager() {
  const { attemptWrite } = useAuth()
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("add")
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAll = async () => {
    const [classesRes, studentsRes, teachersRes] = await Promise.all([
      supabase.from("classes").select("*").order("grade", { ascending: true }),
      supabase.from("students").select("id, class_id"),
      supabase.from("teachers").select("id, name, subject"),
    ])
    if (classesRes.data) setClasses(classesRes.data)
    if (studentsRes.data) setStudents(studentsRes.data)
    if (teachersRes.data) setTeachers(teachersRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const getStudentCount = (classId) => students.filter(s => s.class_id === classId).length
  const getTeacher = (teacherId) => teachers.find(t => t.id === teacherId)

  const teacherOptions = [
    { label: "None", value: "" },
    ...teachers.map(t => ({ label: `${t.name} (${t.subject})`, value: t.id })),
  ]

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const validate = (f) => {
    const e = {}
    if (!f.name?.trim()) e.name = "Name is required."
    if (!f.grade?.trim()) e.grade = "Grade is required."
    if (!f.section?.trim()) e.section = "Section is required."
    if (!f.room?.trim()) e.room = "Room is required."
    return e
  }

  const openAdd = () => {
    if (!attemptWrite("academic")) return
    setModalMode("add")
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setSaved(false)
    setModalOpen(true)
  }

  const openEdit = (cls) => {
    if (!attemptWrite("academic")) return
    setModalMode("edit")
    setEditingId(cls.id)
    setForm({
      name: cls.name,
      grade: String(cls.grade),
      section: cls.section,
      room: cls.room,
      teacher_id: cls.teacher_id ?? "",
    })
    setErrors({})
    setSaved(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      grade: Number(form.grade),
      section: form.section.trim(),
      room: form.room.trim(),
      teacher_id: form.teacher_id || null,
    }

    let error
    if (modalMode === "edit") {
      const res = await supabase.from("classes").update(payload).eq("id", editingId)
      error = res.error
    } else {
      const id = `cls_${Date.now()}`
      const res = await supabase.from("classes").insert({ id, ...payload })
      error = res.error
    }

    setSaving(false)
    if (error) { setModalOpen(false); return }
    setSaved(true)
    setModalOpen(false)
    fetchAll()
    setTimeout(() => setSaved(false), 3000)
  }

  const openConfirmDelete = (cls) => {
    if (!attemptWrite("academic")) return
    setDeleteTarget(cls)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from("classes").delete().eq("id", deleteTarget.id)
    setDeleting(false)
    setConfirmOpen(false)
    setDeleteTarget(null)
    fetchAll()
  }

  const gradeColors = { 9: "#059669", 10: "#0891b2", 11: "#9333ea", 12: "#f59e0b" }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">
            {classes.length} classes across {[...new Set(classes.map(c => c.grade))].length} grades.
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={15} />
          Add Class
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success rounded-lg text-sm text-success font-medium">
          <CheckCircle size={15} />
          Class {modalMode === "add" ? "added" : "updated"} successfully.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map(cls => {
          const teacher = getTeacher(cls.teacher_id)
          const studentCount = getStudentCount(cls.id)
          const color = gradeColors[cls.grade] ?? "#059669"

          return (
            <div key={cls.id} className="card flex flex-col gap-4 hover:ring-2 hover:ring-surface-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ background: color }}
                  >
                    {cls.grade}
                  </div>
                  <div>
                    <h3 className="font-bold text-text">{cls.name}</h3>
                    <p className="text-xs text-muted">Room {cls.room}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(cls)}
                    className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-text transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => openConfirmDelete(cls)}
                    className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Users size={14} className="text-faint mt-1" />
                  <div>
                    <div className="text-xs text-muted">Students</div>
                    <div className="text-sm font-bold text-text">{studentCount}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen size={14} className="text-faint mt-1" />
                  <div>
                    <div className="text-xs text-muted">Section</div>
                    <div className="text-sm font-bold text-text">{cls.section}</div>
                  </div>
                </div>
              </div>

              {teacher && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-2 rounded-lg border border-border">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: color }}
                  >
                    {teacher.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text">{teacher.name}</p>
                    <p className="text-xs text-faint">{teacher.subject}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "add" ? "Add New Class" : "Edit Class"}
        width="max-w-xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Class Name" required value={form.name} onChange={e => set("name", e.target.value)} error={errors.name} placeholder="e.g. Class 9 - Section A" />
            </div>
            <Select label="Class" required options={GRADES} value={form.grade} onChange={v => set("grade", v)} error={errors.grade} placeholder="Select grade" searchable={false} />
            <Input label="Section" required value={form.section} onChange={e => set("section", e.target.value)} error={errors.section} placeholder="e.g. A, B, Science" />
            <Input label="Room" required value={form.room} onChange={e => set("room", e.target.value)} error={errors.room} placeholder="e.g. 101" />
            <Select label="Class Teacher" options={teacherOptions} value={form.teacher_id} onChange={v => set("teacher_id", v)} placeholder="Assign teacher" searchable={false} />
          </div>

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
                : <><Save size={14} /> {modalMode === "add" ? "Add Class" : "Save"}</>
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
        title="Delete Class"
        message={`Are you sure you want to delete ${deleteTarget?.name}? Students assigned to this class will lose their class assignment.`}
        confirmLabel="Delete Class"
      />

    </div>
  )
}