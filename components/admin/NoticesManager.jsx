'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Bell, Plus, Pencil, Trash2, X, Save, AlertCircle } from "lucide-react"
import Input from "@/components/ui/Input"
import Textarea from "@/components/ui/Textarea"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"
import Modal from "../ui/Modal"

const CATEGORIES = ["General", "Exam", "Event", "Meeting", "Holiday"]

const emptyForm = {
  title: "", content: "", category: "General",
  priority: "normal", date: "", expires: "",
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

const categoryBadge = {
  Event: "badge-info", Exam: "badge-danger",
  General: "badge-success", Meeting: "badge-warning", Holiday: "badge-info",
}

export default function NoticesManager() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { user, attemptWrite } = useAuth()

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("date", { ascending: false })
    if (data) setNotices(data)
    setLoading(false)
  }

  useEffect(() => { fetchNotices() }, [])

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const openCreate = () => {
    if (!attemptWrite("cms")) return
    setEditing(null)
    setForm({ ...emptyForm, date: formatDateForDisplay(new Date().toISOString().split("T")[0]) })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (notice) => {
    if (!attemptWrite("cms")) return
    setEditing(notice.id)
    setForm({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      date: formatDateForDisplay(notice.date),
      expires: formatDateForDisplay(notice.expires),
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = "Title is required."
    if (!form.content.trim()) e.content = "Content is required."
    if (!form.date) e.date = "Date is required."
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      priority: form.priority,
      date: formatDateForDB(form.date),
      expires: formatDateForDB(form.expires) ?? null,
      author_id: user?.id,
    }

    let error
    if (editing) {
      const res = await supabase.from("notices").update(payload).eq("id", editing)
      error = res.error
    } else {
      const id = `not_${Date.now()}`
      const res = await supabase.from("notices").insert({ id, ...payload })
      error = res.error
    }

    setSaving(false)
    if (error) return
    setModalOpen(false)
    fetchNotices()
  }

  const handleDelete = async (id) => {
    if (!attemptWrite("cms")) return
    setDeleting(id)
    const { error } = await supabase.from("notices").delete().eq("id", id)
    setDeleting(null)
    if (error) return
    fetchNotices()
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Notices</h1>
          <p className="page-subtitle">{notices.length} notices published.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={15} />
          New Notice
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-20 bg-surface-2 animate-pulse" />)}
        </div>
      ) : notices.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <Bell size={36} className="text-faint" />
          <p className="text-muted text-sm">No notices yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notices.map(notice => (
            <div key={notice.id} className="card flex items-start gap-4 hover:ring hover:ring-surface-2 transition-all duration-200">
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge border ${categoryBadge[notice.category] ?? "badge-info"}`}>{notice.category}</span>
                  {notice.priority === "high" && <span className="badge badge-danger border">Urgent</span>}
                  <span className="text-xs text-faint">
                    {new Date(notice.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <h3 className="font-semibold text-text">{notice.title}</h3>
                <p className="text-sm text-muted line-clamp-2">{notice.content}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(notice)}
                  className="p-2 rounded-md transition-colors hover:bg-surface-2 text-muted hover:text-text"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(notice.id)}
                  disabled={deleting === notice.id}
                  className="p-2 rounded-md transition-colors disabled:opacity-40 hover:bg-surface-2 text-muted hover:text-danger"
                >
                  {deleting === notice.id
                    ? <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-danger/30 border-t-danger block" />
                    : <Trash2 size={15} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Notice" : "New Notice"}
        width="max-w-2xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Title" required value={form.title} onChange={e => set("title", e.target.value)} error={errors.title} placeholder="Notice title" />
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Content" required rows={4} value={form.content} onChange={e => set("content", e.target.value)} error={errors.content} placeholder="Notice content..." />
            </div>
            <Select label="Category" options={CATEGORIES} value={form.category} onChange={v => set("category", v)} searchable={false} />
            <Select
              label="Priority"
              options={[
                { label: "Normal", value: "normal" },
                { label: "High / Urgent", value: "high" },
              ]}
              value={form.priority}
              onChange={v => set("priority", v)}
              searchable={false}
            />
            <DatePicker label="Date" required value={form.date} onChange={v => set("date", v)} error={errors.date} />
            <DatePicker label="Expires" value={form.expires} onChange={v => set("expires", v)} hint="Leave blank for no expiry" />
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 text-xs text-danger">
              <AlertCircle size={13} /> Please fix the errors above.
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-border">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><Save size={14} /> {editing ? "Update" : "Publish"}</>
              }
            </button>
            <button onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}