'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import {
  Plus, Pencil, Trash2, Save,
  CheckCircle, AlertCircle,
} from "lucide-react"
import DataTable from "@/components/ui/DataTable"
import SearchBox from "@/components/ui/SearchBox"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

const BADGE_COLORS = [
  "bg-emerald-50 text-emerald-700 border border-emerald-700",
  "bg-cyan-50 text-cyan-700 border border-cyan-700",
  "bg-amber-50 text-amber-700 border border-amber-700",
  "bg-purple-50 text-purple-700 border border-purple-700",
  "bg-red-50 text-red-700 border border-red-700",
  "bg-green-50 text-green-700 border border-green-700",
  "bg-sky-50 text-sky-700 border border-sky-700",
  "bg-orange-50 text-orange-700 border border-orange-700",
  "bg-teal-50 text-teal-700 border border-teal-700",
  "bg-indigo-50 text-indigo-700 border border-indigo-700",
  "bg-violet-50 text-violet-700 border border-violet-700",
  "bg-lime-50 text-lime-700 border border-lime-700",
  "bg-pink-50 text-pink-700 border border-pink-700",
  "bg-blue-50 text-blue-700 border border-blue-700",
  "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-700",
  "bg-rose-50 text-rose-700 border border-rose-700",
  "bg-stone-50 text-stone-700 border border-stone-700",
  "bg-yellow-50 text-yellow-700 border border-yellow-700",
  "bg-slate-50 text-slate-700 border border-slate-700",
  "bg-zinc-50 text-zinc-700 border border-zinc-700",
]

const ROLE_BADGE_COLORS = [
  "bg-blue-50 text-blue-700 border border-blue-700",
  "bg-indigo-50 text-indigo-700 border border-indigo-700",
  "bg-emerald-50 text-emerald-700 border border-emerald-700",
  "bg-purple-50 text-purple-700 border border-purple-700",
  "bg-violet-50 text-violet-700 border border-violet-700",
  "bg-teal-50 text-teal-700 border border-teal-700",
  "bg-cyan-50 text-cyan-700 border border-cyan-700",
  "bg-orange-50 text-orange-700 border border-orange-700",
  "bg-rose-50 text-rose-700 border border-rose-700",
]

const AVATAR_COLORS = [
  "#059669", "#0891b2", "#f59e0b", "#9333ea", "#ef4444",
  "#10b981", "#0ea5e9", "#f97316", "#14b8a6", "#6366f1",
  "#8b5cf6", "#84cc16", "#ec4899", "#3b82f6", "#d946ef",
  "#f43f5e", "#78716c", "#eab308", "#64748b", "#71717a",
]

function formatDateForDisplay(isoDate) {
  if (!isoDate) return ""
  const [y, m, d] = isoDate.split("-")
  return `${d}/${m}/${y}`
}

function formatDateForDB(ddmmyyyy) {
  if (!ddmmyyyy) return null
  const [d, m, y] = ddmmyyyy.split("/")
  return `${y}-${m}-${d}`
}

const emptyForm = {
  name: "", email: "", subject: "", role: "",
  phone: "", join_date: "", class_id: "",
}

export default function TeachersManager() {
  const { attemptWrite } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
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
    const [teachersRes, classesRes, subjectsRes] = await Promise.all([
      supabase.from("teachers").select("*").order("join_date", { ascending: true }),
      supabase.from("classes").select("*"),
      supabase.from("subjects").select("id, name").order("name", { ascending: true }),
    ])
    if (teachersRes.data) setTeachers(teachersRes.data)
    if (classesRes.data) setClasses(classesRes.data)
    if (subjectsRes.data) setSubjects(subjectsRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = teachers.filter(t =>
    search === "" ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(search.toLowerCase()))
  )

  const getClassName = (classId) => classes.find(c => c.id === classId)?.name ?? "—"
  const initials = (name) => name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  const getSubjectBadge = (subjectName) => {
    const idx = subjects.findIndex(s => s.name === subjectName)
    return BADGE_COLORS[idx % BADGE_COLORS.length] ?? BADGE_COLORS[0]
  }

  const getRoleBadge = (role) => {
    const roles = [...new Set(teachers.map(t => t.role).filter(Boolean))]
    const idx = roles.indexOf(role)
    return ROLE_BADGE_COLORS[idx % ROLE_BADGE_COLORS.length] ?? ROLE_BADGE_COLORS[0]
  }

  const getAvatarColor = (subjectName) => {
    const idx = subjects.findIndex(s => s.name === subjectName)
    return AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
  }

  const classOptions = [
    { label: "None", value: "" },
    ...classes.map(c => ({ label: c.name, value: c.id })),
  ]

  const subjectOptions = [
    { label: "None", value: "" },
    ...subjects.map(s => ({ label: s.name, value: s.name })),
  ]

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name?.trim()) e.name = "Name is required."
    if (!form.email?.trim()) e.email = "Email is required."
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

  const openEdit = (teacher) => {
    if (!attemptWrite("academic")) return
    setModalMode("edit")
    setEditingId(teacher.id)
    setForm({
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject ?? "",
      role: teacher.role ?? "",
      phone: teacher.phone ?? "",
      join_date: formatDateForDisplay(teacher.join_date),
      class_id: teacher.class_id ?? "",
    })
    setErrors({})
    setSaved(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject || null,
      role: form.role.trim(),
      phone: form.phone.trim(),
      join_date: formatDateForDB(form.join_date),
      class_id: form.class_id || null,
      avatar: null,
    }

    let error
    if (modalMode === "edit") {
      const res = await supabase.from("teachers").update(payload).eq("id", editingId)
      error = res.error
    } else {
      const id = `tch_${Date.now()}`
      const res = await supabase.from("teachers").insert({ id, ...payload })
      error = res.error
    }

    setSaving(false)
    if (error) { setModalOpen(false); return }
    setSaved(true)
    setModalOpen(false)
    fetchAll()
    setTimeout(() => setSaved(false), 3000)
  }

  const openConfirmDelete = (teacher) => {
    if (!attemptWrite("academic")) return
    setDeleteTarget(teacher)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from("teachers").delete().eq("id", deleteTarget.id)
    setDeleting(false)
    setConfirmOpen(false)
    setDeleteTarget(null)
    fetchAll()
  }

  const columns = [
    {
      key: "name", label: "Teacher", sortable: true, width: 220,
      render: (row) => {
        const color = getAvatarColor(row.subject)
        return (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
              style={{ background: color }}
            >
              {row.avatar
                ? <img src={row.avatar} className="w-8 h-8 rounded-full object-cover" alt={row.name} />
                : initials(row.name)
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text truncate">{row.name}</p>
              <p className="text-xs text-faint truncate">{row.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "subject", label: "Subject", sortable: true, width: 140,
      render: (row) => {
        if (!row.subject) return <span className="text-sm text-faint">—</span>
        return (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getSubjectBadge(row.subject)}`}>
            {row.subject}
          </span>
        )
      },
    },
    {
      key: "role", label: "Role", sortable: true, width: 140,
      render: (row) => {
        if (!row.role) return <span className="text-sm text-faint">—</span>
        return (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getRoleBadge(row.role)}`}>
            {row.role}
          </span>
        )
      },
    },
    {
      key: "class_id", label: "Class", sortable: false, width: 180,
      render: (row) => (
        <span className="text-sm text-muted">
          {row.class_id ? getClassName(row.class_id) : "—"}
        </span>
      ),
    },
    {
      key: "phone", label: "Phone", sortable: false, width: 150,
      render: (row) => <span className="text-sm text-muted">{row.phone}</span>,
    },
    {
      key: "join_date", label: "Joined", sortable: true, width: 130,
      render: (row) => (
        <span className="text-sm text-muted">
          {new Date(row.join_date).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions", label: "Action", sortable: false, width: 80,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row) }}
            className="p-1.5 rounded-md transition-colors hover:bg-surface-2 text-muted hover:text-text"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openConfirmDelete(row) }}
            className="p-1.5 rounded-md transition-colors hover:bg-surface-2 text-muted hover:text-danger"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">{teachers.length} staff members.</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={15} />
          Add Teacher
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success rounded-lg text-sm text-success font-medium">
          <CheckCircle size={15} />
          Teacher {modalMode === "add" ? "added" : "updated"} successfully.
        </div>
      )}

      <div className="max-w-sm">
        <SearchBox
          placeholder="Search by name, email or subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />
      </div>

      <DataTable
        key={search}
        columns={columns}
        data={filtered}
        pageSize={20}
        loading={loading}
        emptyMessage="No teachers found."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "add" ? "Add New Teacher" : "Edit Teacher"}
        width="max-w-2xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" required value={form.name} onChange={e => setField("name", e.target.value)} error={errors.name} placeholder="Teacher's full name" />
            <Input label="Email" type="email" required value={form.email} onChange={e => setField("email", e.target.value)} error={errors.email} placeholder="teacher@greenfieldacademy.edu.bd" />
            <Input label="Phone" value={form.phone} onChange={e => setField("phone", e.target.value)} placeholder="+880-XXXX-XXXXXX" />
            <Select
              label="Subject"
              options={subjectOptions}
              value={form.subject}
              onChange={v => setField("subject", v)}
              placeholder="Select subject (optional)"
              searchable={false}
            />
            <Input label="Role" value={form.role} onChange={e => setField("role", e.target.value)} placeholder="e.g., Senior Lecturer, Principal..." error={errors.role} />
            <Select label="Assigned Class" options={classOptions} value={form.class_id} onChange={v => setField("class_id", v)} placeholder="Select class" searchable={false} />
            <DatePicker label="Join Date" value={form.join_date} onChange={v => setField("join_date", v)} />
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
                : <><Save size={14} /> {modalMode === "add" ? "Add Teacher" : "Save"}</>
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
        title="Delete Teacher"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete Teacher"
      />

    </div>
  )
}