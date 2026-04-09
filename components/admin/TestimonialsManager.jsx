'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import Modal from "@/components/ui/Modal"
import { MessageSquare, Plus, Pencil, Trash2, X, Save, AlertCircle, Eye, EyeOff } from "lucide-react"
import Input from "@/components/ui/Input"
import Textarea from "@/components/ui/Textarea"
import Select from "@/components/ui/Select"

const CLASS_OPTIONS = [
  "Class 9 - Section A", "Class 9 - Section B",
  "Class 10 - Section A", "Class 10 - Section B",
  "Class 11 - Science", "Class 11 - Commerce",
]

const emptyForm = { name: "", quote: "", child_class: "", avatar: "" }

export default function TestimonialsManager() {
  const { attemptWrite } = useAuth()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("id", { ascending: true })
    if (data) setTestimonials(data)
    setLoading(false)
  }

  useEffect(() => { fetchTestimonials() }, [])

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const openCreate = () => {
    if (!attemptWrite("cms")) return
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (t) => {
    if (!attemptWrite("cms")) return
    setEditing(t.id)
    setForm({ name: t.name, quote: t.quote, child_class: t.child_class, avatar: t.avatar ?? "" })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = "Name is required."
    if (!form.quote.trim()) e.quote = "Quote is required."
    if (!form.child_class.trim()) e.child_class = "Class is required."
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      quote: form.quote.trim(),
      child_class: form.child_class,
      avatar: form.avatar.trim() || null,
    }

    let error
    if (editing) {
      const res = await supabase.from("testimonials").update(payload).eq("id", editing)
      error = res.error
    } else {
      const id = `tst_${Date.now()}`
      const res = await supabase.from("testimonials").insert({ id, active: true, ...payload })
      error = res.error
    }

    setSaving(false)
    if (error) return
    setModalOpen(false)
    fetchTestimonials()
  }

  const handleDelete = async (id) => {
    if (!attemptWrite("cms")) return
    setDeleting(id)
    const { error } = await supabase.from("testimonials").delete().eq("id", id)
    setDeleting(null)
    if (error) return
    fetchTestimonials()
  }

  const toggleActive = async (t) => {
    if (!attemptWrite("cms")) return
    await supabase
      .from("testimonials")
      .update({ active: !t.active })
      .eq("id", t.id)
    fetchTestimonials()
  }

  const initials = (name) => name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Testimonials</h1>
          <p className="page-subtitle">{testimonials.length} total · {testimonials.filter(t => t.active).length} active.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={15} />
          New Testimonial
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-40 bg-surface-2 animate-pulse" />)}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <MessageSquare size={36} className="text-faint" />
          <p className="text-muted text-sm">No testimonials yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t.id} className={`card flex flex-col gap-3 hover:ring hover:ring-surface-2 transition-all duration-200 ${!t.active ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full bg-surface-2" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {initials(t.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-text">{t.name}</p>
                    <p className="text-xs text-faint">{t.child_class}</p>
                  </div>
                </div>
                <span className={`hidden 2xl:flex badge border ${t.active ? "badge-success" : "badge-warning"}`}>
                  <span className={`w-2 h-2 mr-2 rounded-full ${t.active ? "bg-success" : "bg-warning"}`}></span>

                  {t.active ? "Active" : "Hidden"}
                </span>
              </div>
              <p className="text-sm text-muted italic leading-relaxed line-clamp-3">"{t.quote}"</p>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                <button
                  onClick={() => toggleActive(t)}
                  className={`p-1.5 rounded-md transition-colors ${t.active ? "text-warning hover:bg-surface-2" : "text-success hover:bg-surface-2"}`}
                >
                  {t.active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => openEdit(t)}
                  className="p-1.5 rounded-md transition-colors hover:bg-surface-2 text-muted hover:text-text"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deleting === t.id}
                  className="p-1.5 rounded-md transition-colors disabled:opacity-40 hover:bg-surface-2 text-muted hover:text-danger"
                >
                  {deleting === t.id
                    ? <span className="w-3 h-3 animate-spin rounded-full border-2 border-danger/30 border-t-danger block" />
                    : <Trash2 size={14} />
                  }
                </button>
                <span className={`flex 2xl:hidden badge border ms-auto ${t.active ? "badge-success" : "badge-warning"}`}>
                  <span className={`w-2 h-2 mr-2 rounded-full ${t.active ? "bg-success" : "bg-warning"}`}></span>

                  {t.active ? "Active" : "Hidden"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Testimonial" : "New Testimonial"}
        width="max-w-xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Parent Name"
              required
              value={form.name}
              onChange={e => set("name", e.target.value)}
              error={errors.name}
              placeholder="e.g. Mrs. Sharifa Begum"
            />
            <Select
              label="Child's Class"
              required
              options={CLASS_OPTIONS}
              value={form.child_class}
              onChange={v => set("child_class", v)}
              error={errors.child_class}
              placeholder="Select class"
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Quote"
                required
                rows={3}
                value={form.quote}
                onChange={e => set("quote", e.target.value)}
                error={errors.quote}
                placeholder="What did the parent say..."
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Avatar URL"
                value={form.avatar}
                onChange={e => set("avatar", e.target.value)}
                placeholder="https://... (leave blank for initials)"
                hint="Leave blank to use initials avatar."
              />
            </div>
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
                : <><Save size={14} /> {editing ? "Update" : "Save"}</>
              }
            </button>
            <button onClick={() => setModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}