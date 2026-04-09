'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Calendar, Plus, Pencil, Trash2, X, Save, Eye, EyeOff, AlertCircle } from "lucide-react"
import Input from "@/components/ui/Input"
import Textarea from "@/components/ui/Textarea"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"
import Modal from "@/components/ui/Modal"
import dynamic from "next/dynamic"

const TipTapEditor = dynamic(() => import("@/components/ui/TipTapEditor"), { ssr: false })

const CATEGORIES = ["Sports", "Academic", "Cultural", "General"]

const emptyForm = {
  title: "", slug: "", excerpt: "", content: "",
  category: "General", date: "", cover_image: "", published: false,
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

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default function EventsManager() {
  const { user, attemptWrite, isSuperAdmin, superAdminName } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [imageUrls, setImageUrls] = useState([""])
  const [modalOpen, setModalOpen] = useState(false)

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const set = (key, val) => {
    setForm(f => {
      const updated = { ...f, [key]: val }
      if (key === "title" && !editing) updated.slug = slugify(val)
      return updated
    })
    setErrors(e => ({ ...e, [key]: null }))
  }

  const openCreate = () => {
    if (!attemptWrite("cms")) return
    setEditing(null)
    setForm({ ...emptyForm, date: formatDateForDisplay(new Date().toISOString().split("T")[0]) })
    setImageUrls([""])
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = async (event) => {
    if (!attemptWrite("cms")) return
    setEditing(event.id)
    setForm({
      title: event.title,
      slug: event.slug,
      excerpt: event.excerpt ?? "",
      content: event.content ?? "",
      category: event.category,
      date: formatDateForDisplay(event.date),
      cover_image: event.cover_image ?? "",
      published: event.published,
    })
    const { data: imgs } = await supabase
      .from("event_images")
      .select("*")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true })
    setImageUrls(imgs?.map(i => i.url) ?? [""])
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = "Title is required."
    if (!form.slug.trim()) e.slug = "Slug is required."
    if (!form.excerpt.trim()) e.excerpt = "Excerpt is required."
    if (!form.date) e.date = "Date is required."
    return e
  }

  const handleSave = async (publish = null) => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      category: form.category,
      date: formatDateForDB(form.date),
      cover_image: form.cover_image.trim() || null,
      published: publish !== null ? publish : form.published,
      ...(editing ? {} : {
        author_id: isSuperAdmin ? (superAdminName ?? "Super Admin") : (user?.id ?? null),
        author_name: isSuperAdmin ? (superAdminName ?? "Super Admin") : (user?.name ?? "Admin"),
      }),
    }
    let eventId = editing
    let error

    if (editing) {
      const res = await supabase.from("events").update(payload).eq("id", editing)
      error = res.error
    } else {
      eventId = `evt_${Date.now()}`
      const res = await supabase.from("events").insert({ id: eventId, ...payload })
      error = res.error
    }

    setSaving(false)
    if (error) return

    const validUrls = imageUrls.filter(u => u.trim())
    if (validUrls.length > 0) {
      await supabase.from("event_images").delete().eq("event_id", eventId)
      await supabase.from("event_images").insert(
        validUrls.map((url, i) => ({
          id: `eimg_${eventId}_${i}`,
          event_id: eventId,
          url: url.trim(),
          sort_order: i,
        }))
      )
    }

    setModalOpen(false)
    fetchEvents()
  }

  const handleDelete = async (id) => {
    if (!attemptWrite("cms")) return
    setDeleting(id)
    const { error } = await supabase.from("events").delete().eq("id", id)
    if (!error) await supabase.from("event_images").delete().eq("event_id", id)
    setDeleting(null)
    fetchEvents()
  }

  const togglePublish = async (event) => {
    if (!attemptWrite("cms")) return
    await supabase
      .from("events")
      .update({ published: !event.published })
      .eq("id", event.id)
    fetchEvents()
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">{events.length} events · {events.filter(e => e.published).length} published.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={15} />
          New Event
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-24 bg-surface-2 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3 text-center">
          <Calendar size={36} className="text-faint" />
          <p className="text-muted text-sm">No events yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map(event => (
            <div key={event.id} className="card flex items-center gap-4 hover:ring hover:ring-surface-2 transition-all duration-200">
              {event.cover_image && (
                <img src={event.cover_image} alt={event.title} className="w-20 h-14 rounded-lg object-cover shrink-0 hidden sm:block" />
              )}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge border ${event.published ? "badge-success" : "badge-warning"}`}>
                    {event.published ? "Published" : "Draft"}
                  </span>
                  <span className="badge badge-info border">{event.category}</span>
                  <span className="text-xs text-faint">
                    {new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <h3 className="font-semibold text-text truncate">{event.title}</h3>
                <a href={`/events/${event.slug}`} className="text-xs text-muted truncate hover:text-primary transition-colors">
                  /events/{event.slug}
                </a>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublish(event)}
                  className={`p-2 rounded-md transition-colors ${event.published ? "text-warning hover:bg-surface-2" : "text-success hover:bg-surface-2"}`}
                >
                  {event.published ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => openEdit(event)}
                  className="p-2 rounded-md transition-colors hover:bg-surface-2 text-muted hover:text-text"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deleting === event.id}
                  className="p-2 rounded-md transition-colors disabled:opacity-40 hover:bg-surface-2 text-muted hover:text-danger"
                >
                  {deleting === event.id
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
        title={editing ? "Edit Event" : "New Event"}
        width="max-w-3xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Title" required value={form.title} onChange={e => set("title", e.target.value)} error={errors.title} placeholder="Event title" />
            </div>
            <Input label="Slug" required value={form.slug} onChange={e => set("slug", slugify(e.target.value))} error={errors.slug} placeholder="event-slug" hint="Auto-generated from title." />
            <Select label="Category" options={CATEGORIES} value={form.category} onChange={v => set("category", v)} searchable={false} />
            <DatePicker label="Event Date" required value={form.date} onChange={v => set("date", v)} error={errors.date} />
            <Input label="Cover Image URL" value={form.cover_image} onChange={e => set("cover_image", e.target.value)} placeholder="https://..." />
            <div className="sm:col-span-2">
              <Textarea label="Excerpt" required rows={2} value={form.excerpt} onChange={e => set("excerpt", e.target.value)} error={errors.excerpt} placeholder="Short description for event cards..." />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">Content</label>
              <TipTapEditor content={form.content} onChange={html => set("content", html)} />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-3">
              <label className="text-xs font-semibold text-text">Gallery Images</label>
              <div className="flex flex-col gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={url}
                      onChange={e => {
                        const next = [...imageUrls]
                        next[i] = e.target.value
                        setImageUrls(next)
                      }}
                      placeholder={`Image URL ${i + 1}`}
                      className="input flex-1"
                    />
                    {imageUrls.length > 1 && (
                      <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))} className="text-faint hover:text-danger p-1.5">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setImageUrls([...imageUrls, ""])} className="btn btn-outline text-xs w-fit">
                  <Plus size={13} /> Add Image URL
                </button>
              </div>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 text-xs text-danger">
              <AlertCircle size={13} /> Please fix the errors above.
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-border flex-wrap">
            <button onClick={() => handleSave()} disabled={saving} className="btn btn-primary disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><Save size={14} /> Save</>
              }
            </button>
            <button onClick={() => handleSave(!form.published)} disabled={saving} className="btn btn-outline disabled:opacity-60">
              {form.published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Save & Publish</>}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}