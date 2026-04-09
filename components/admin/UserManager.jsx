'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import {
  Plus, Trash2, Save,
  CheckCircle, AlertCircle,
} from "lucide-react"
import DataTable from "@/components/ui/DataTable"
import SearchBox from "@/components/ui/SearchBox"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

const emptyForm = { name: "", email: "", phone: "", address: "", role: "admin" }

export default function UserManager() {
  const { attemptWrite } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [saved, setSaved] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: true })
    if (data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u =>
    search === "" ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name?.trim()) e.name = "Name is required."
    if (!form.email?.trim()) e.email = "Email is required."
    return e
  }

  const openAdd = () => {
    if (!attemptWrite("users")) return
    setForm(emptyForm)
    setErrors({})
    setSaved(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    const id = `usr_${Date.now()}`
    const { error } = await supabase.from("users").insert({
      id,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      role: form.role,
    })

    setSaving(false)
    if (error) { setModalOpen(false); return }
    setSaved(true)
    setModalOpen(false)
    fetchUsers()
    setTimeout(() => setSaved(false), 3000)
  }

  const openConfirmDelete = (user) => {
    if (!attemptWrite("users")) return
    setDeleteTarget(user)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from("users").delete().eq("id", deleteTarget.id)
    setDeleting(false)
    setConfirmOpen(false)
    setDeleteTarget(null)
    fetchUsers()
  }

  const initials = (name) =>
    name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  const columns = [
    {
      key: "name", label: "Admin User", sortable: true, width: 220,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials(row.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">{row.name}</p>
            <p className="text-xs text-faint truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone", label: "Phone", sortable: false, width: 160,
      render: (row) => <span className="text-sm text-muted">{row.phone ?? "—"}</span>,
    },
    {
      key: "address", label: "Address", sortable: false, width: 200,
      render: (row) => <span className="text-sm text-muted truncate">{row.address ?? "—"}</span>,
    },
    {
      key: "created_at", label: "Added", sortable: true, width: 130,
      render: (row) => (
        <span className="text-sm text-muted">
          {new Date(row.created_at).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "role", label: "Role", sortable: true, width: 120,
      render: (row) => {
        const roleConfig = {
          admin: { label: "Admin", badge: "badge-danger" },
          editor: { label: "Editor", badge: "badge-info" },
          mock_admin: { label: "Mock Admin", badge: "badge-warning" },
          mock_editor: { label: "Mock Editor", badge: "badge-warning" },
          super_admin: { label: "Super Admin", badge: "badge-success" },
        }
        const cfg = roleConfig[row.role] ?? { label: row.role, badge: "badge-info" }
        return <span className={`badge border ${cfg.badge}`}>{cfg.label}</span>
      },
    },
    {
      key: "actions", label: "Action", sortable: false, width: 60,
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); openConfirmDelete(row) }}
          className="p-1.5 rounded-md transition-colors hover:bg-surface-2 text-muted hover:text-danger"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Admin Users</h1>
          <p className="page-subtitle">{users.length} portal users.</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={15} />
          Add Admin
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success rounded-lg text-sm text-success font-medium">
          <CheckCircle size={15} /> Admin user added successfully.
        </div>
      )}

      <div className="max-w-sm">
        <SearchBox
          placeholder="Search by name or email..."
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
        emptyMessage="No admin users found."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Admin User"
        width="max-w-2xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" required value={form.name} onChange={e => set("name", e.target.value)} error={errors.name} placeholder="Admin's full name" />
            <Select
              label="Role"
              required
              options={[
                { label: "Admin", value: "admin" },
                { label: "Editor", value: "editor" },
                { label: "Mock Admin", value: "mock_admin" },
                { label: "Mock Editor", value: "mock_editor" },
              ]}
              value={form.role}
              onChange={v => set("role", v)}
              searchable={false}
            />
            <Input label="Email" type="email" required value={form.email} onChange={e => set("email", e.target.value)} error={errors.email} placeholder="admin@greenfieldacademy.edu.bd" />
            <Input label="Phone" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+880-XXXX-XXXXXX" />
            <div className="sm:col-span-2">
              <Input label="Address" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Residential address" />
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
                : <><Save size={14} /> Add Admin</>
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
        title="Delete Admin User"
        message={`Are you sure you want to remove ${deleteTarget?.name} as an admin? They will lose access to the admin portal immediately.`}
        confirmLabel="Delete Admin"
      />

    </div>
  )
}