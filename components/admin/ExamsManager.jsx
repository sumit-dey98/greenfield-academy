'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import {
  Plus, Pencil, Trash2, Save,
  CheckCircle, AlertCircle, Calendar,
} from "lucide-react"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

const STATUS_OPTIONS = ["upcoming", "grading", "ended"]

const statusBadge = {
  upcoming: "badge-info border-info-600",
  grading: "badge-success border-success-600",
  ended: "badge-warning border-warning-600",
}

const emptyForm = { name: "", start_date: "", end_date: "", status: "upcoming" }

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

export default function ExamsManager() {
  const { attemptWrite } = useAuth()
  const [exams, setExams] = useState([])
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

  const fetchExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*")
      .order("start_date", { ascending: true })
    if (data) setExams(data)
    setLoading(false)
  }

  useEffect(() => { fetchExams() }, [])

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name?.trim()) e.name = "Exam name is required."
    return e
  }

  const openAdd = () => {
    if (!attemptWrite("academic")) return
    setModalMode("add")
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (exam) => {
    if (!attemptWrite("academic")) return
    if (exam.status === "ended") return
    setModalMode("edit")
    setEditingId(exam.id)
    setForm({
      name: exam.name,
      start_date: formatDateForDisplay(exam.start_date),
      end_date: formatDateForDisplay(exam.end_date),
      status: exam.status,
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      start_date: formatDateForDB(form.start_date),
      end_date: formatDateForDB(form.end_date),
      status: form.status,
    }

    let error
    if (modalMode === "edit") {
      const res = await supabase.from("exams").update(payload).eq("id", editingId)
      error = res.error
    } else {
      const id = `exam_${Date.now()}`
      const res = await supabase.from("exams").insert({ id, ...payload })
      error = res.error
    }

    setSaving(false)
    if (error) { setModalOpen(false); return }
    setSaved(true)
    setModalOpen(false)
    fetchExams()
    setTimeout(() => setSaved(false), 3000)
  }

  const openConfirmDelete = (exam) => {
    if (!attemptWrite("academic")) return
    setDeleteTarget(exam)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from("exams").delete().eq("id", deleteTarget.id)
    setDeleting(false)
    setConfirmOpen(false)
    setDeleteTarget(null)
    fetchExams()
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
          <h1 className="page-title">Exams</h1>
          <p className="page-subtitle">{exams.length} exams · {exams.filter(e => e.status === "upcoming").length} upcoming.</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={15} />
          Add Exam
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success rounded-lg text-sm text-success font-medium">
          <CheckCircle size={15} />
          Exam {modalMode === "add" ? "added" : "updated"} successfully.
        </div>
      )}

      {exams.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <Calendar size={36} className="text-faint" />
          <p className="text-muted text-sm">No exams yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.slice().reverse().map(exam => (
            <div key={exam.id} className="card flex flex-col gap-3 transition-all duration-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <h3 className="font-bold text-text truncate text-base">{exam.name}</h3>
                  <span className={`badge w-fit border ${statusBadge[exam.status] ?? "badge-info border-info-600"}`}>
                    {exam.status}
                  </span>
                </div>
                {exam.status !== "ended" && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(exam)}
                      className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-text transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => openConfirmDelete(exam)}
                      className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />

              <div className="flex flex-col gap-1.5 text-sm text-muted">
                {exam.start_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-text font-medium">Start</span>
                    <span className="font-medium text-text">
                      {new Date(exam.start_date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {exam.end_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-text font-medium">End</span>
                    <span className="font-medium text-text">
                      {new Date(exam.end_date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {!exam.start_date && !exam.end_date && (
                  <span className="text-faint">No dates set</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "add" ? "Add Exam" : "Edit Exam"}
        width="max-w-md"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Exam Name"
                required
                value={form.name}
                onChange={e => set("name", e.target.value)}
                error={errors.name}
                placeholder="e.g. Midterm 2025"
              />
            </div>
            <DatePicker label="Start Date" value={form.start_date} onChange={v => set("start_date", v)} />
            <DatePicker label="End Date" value={form.end_date} onChange={v => set("end_date", v)} />
            <div className="sm:col-span-2">
              <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={v => set("status", v)} searchable={false} />
            </div>
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
                : <><Save size={14} /> {modalMode === "add" ? "Add Exam" : "Save"}</>
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
        title="Delete Exam"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete Exam"
      />

    </div>
  )
}