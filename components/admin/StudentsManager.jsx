'use client'

import { useEffect, useState } from "react"
import { listStudents, createStudent, updateStudent, deleteStudent } from "@/lib/api/adminPeople"
import { listClasses } from "@/lib/api/classes"
import { useAuth } from "@/context/AuthContext"
import {
  Plus, Pencil, Trash2, Save,
  CheckCircle, AlertCircle,
} from "lucide-react"
import DataTable from "@/components/ui/DataTable"
import { toLimitOffset } from "@/components/ui/Pagination"
import SearchBox from "@/components/ui/SearchBox"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import DatePicker from "@/components/ui/DatePicker"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

const GENDERS = ["Male", "Female"]

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
  name: "", email: "", roll: "", gender: "",
  dob: "", phone: "", address: "",
  guardian: "", guardian_phone: "", class_id: "",
}

const PAGE_SIZE = 20

export default function StudentsManager() {
  const { attemptWrite } = useAuth()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("")

  // Server-driven pagination state.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [total, setTotal] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("add")
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    listClasses()
      .then(data => setClasses(data ?? []))
      .catch(err => console.error("Failed to load classes:", err))
  }, [])

  // Server-side search is on `name` only; debounce keystrokes so we don't fire a
  // request per character.
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  // Reset to page 1 whenever the filters change.
  useEffect(() => { setPage(1) }, [debouncedSearch, classFilter, pageSize])

  // Fetch the current page from the server whenever paging or filters change.
  const fetchStudents = async () => {
    setLoading(true)
    try {
      const studentsPage = await listStudents({
        ...toLimitOffset(page, pageSize),
        name: debouncedSearch || undefined,
        class_id: classFilter || undefined,
      })
      setStudents(studentsPage?.items ?? [])
      setTotal(studentsPage?.total ?? 0)
    } catch (err) {
      console.error("Failed to load students:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [page, pageSize, debouncedSearch, classFilter])

  const classOptions = [
    { label: "All Classes", value: "" },
    ...classes.map(c => ({ label: c.name, value: c.id })),
  ]

  const classSelectOptions = classes.map(c => ({ label: c.name, value: c.id }))

  const initials = (name) => name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
  const getClassName = (classId) => classes.find(c => c.id === classId)?.name ?? "—"

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name?.trim()) e.name = "Name is required."
    if (!form.email?.trim()) e.email = "Email is required."
    if (!form.roll) e.roll = "Roll is required."
    if (!form.class_id) e.class_id = "Class is required."
    if (!form.gender) e.gender = "Gender is required."
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

  const openEdit = (student) => {
    if (!attemptWrite("academic")) return
    setModalMode("edit")
    setEditingId(student.id)
    setForm({
      name: student.name,
      email: student.email,
      roll: student.roll,
      gender: student.gender ?? "",
      dob: formatDateForDisplay(student.dob),
      phone: student.phone ?? "",
      address: student.address ?? "",
      guardian: student.guardian ?? "",
      guardian_phone: student.guardian_phone ?? "",
      class_id: student.class_id,
    })
    setErrors({})
    setSaved(false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)

    // id and role are server-managed; password is set by the student at first login.
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      roll: Number(form.roll),
      gender: form.gender,
      dob: formatDateForDB(form.dob),
      phone: form.phone.trim(),
      address: form.address.trim(),
      guardian: form.guardian.trim(),
      guardian_phone: form.guardian_phone.trim(),
      class_id: form.class_id,
    }

    try {
      if (modalMode === "edit") {
        await updateStudent(editingId, payload)
      } else {
        await createStudent(payload)
      }
      setSaved(true)
      setModalOpen(false)
      fetchStudents()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save student:", err)
      setErrors({ save: err?.message || "Could not save the student." })
    } finally {
      setSaving(false)
    }
  }

  const openConfirmDelete = (student) => {
    if (!attemptWrite("academic")) return
    setDeleteTarget(student)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteStudent(deleteTarget.id)
    } catch (err) {
      console.error("Failed to delete student:", err)
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteTarget(null)
      fetchStudents()
    }
  }

  const columns = [
    {
      key: "roll", label: "Roll", sortable: true, width: 70,
      render: (row) => <span className="text-sm text-muted">{row.roll}</span>,
    },
    {
      key: "name", label: "Student", sortable: true, width: 220,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: "#059669" }}
            >
              {initials(row.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">{row.name}</p>
            <p className="text-xs text-faint truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "class_id", label: "Class", sortable: true, width: 180,
      render: (row) => <span className="text-sm text-muted">{getClassName(row.class_id)}</span>,
    },
    {
      key: "gender", label: "Gender", sortable: true, width: 100,
      render: (row) => <span className="text-sm text-muted">{row.gender}</span>,
    },
    {
      key: "guardian", label: "Guardian", sortable: false, width: 160,
      render: (row) => (
        <div>
          <p className="text-sm text-text">{row.guardian}</p>
          <p className="text-xs text-faint">{row.guardian_phone}</p>
        </div>
      ),
    },
    {
      key: "phone", label: "Phone", sortable: false, width: 150,
      render: (row) => <span className="text-sm text-muted">{row.phone}</span>,
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
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{total} students enrolled.</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={15} />
          Add Student
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success rounded-lg text-sm text-success font-medium">
          <CheckCircle size={15} />
          Student {modalMode === "add" ? "added" : "updated"} successfully.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBox
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClear={() => setSearch("")}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            options={classOptions}
            value={classFilter}
            onChange={setClassFilter}
            placeholder="Filter by class"
            searchable={false}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        serverMode
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        emptyMessage="No students found."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "add" ? "Add New Student" : "Edit Student"}
        width="max-w-3xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Full Name" required value={form.name} onChange={e => set("name", e.target.value)} error={errors.name} placeholder="Student's full name" />
            <Input label="Email" type="email" required value={form.email} onChange={e => set("email", e.target.value)} error={errors.email} placeholder="student@school.edu.bd" />
            <Input label="Roll Number" type="number" required value={form.roll} onChange={e => set("roll", e.target.value)} error={errors.roll} placeholder="e.g. 1" />
            <Select label="Class" required options={classSelectOptions} value={form.class_id} onChange={v => set("class_id", v)} error={errors.class_id} placeholder="Select class" searchable={false} />
            <Select label="Gender" required options={GENDERS} value={form.gender} onChange={v => set("gender", v)} error={errors.gender} placeholder="Select gender" searchable={false} />
            <DatePicker label="Date of Birth" value={form.dob} onChange={v => set("dob", v)} maxDate={new Date()} />
            <Input label="Phone" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+880-XXXX-XXXXXX" />
            <Input label="Guardian Name" value={form.guardian} onChange={e => set("guardian", e.target.value)} placeholder="Guardian's full name" />
            <Input label="Guardian Phone" value={form.guardian_phone} onChange={e => set("guardian_phone", e.target.value)} placeholder="+880-XXXX-XXXXXX" />
            <div className="sm:col-span-2 lg:col-span-3">
              <Input label="Address" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full residential address" />
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 text-xs text-danger">
              <AlertCircle size={13} className="shrink-0" />
              Please fix the errors above.
            </div>
          )}

          <div className="flex gap-3 pt-5 border-t border-border">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><Save size={14} /> {modalMode === "add" ? "Add Student" : "Save"}</>
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
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will permanently remove their results and attendance records as well.`}
        confirmLabel="Delete Student"
      />

    </div>
  )
}