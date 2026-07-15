'use client'

import { useEffect, useState } from "react"
import { listCycles, createCycle, updateCycle } from "@/lib/api/admissions"
import { useAuth } from "@/context/AuthContext"
import { Plus, Save, CheckCircle, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import DataTable from "@/components/ui/DataTable"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import CheckBox from "@/components/ui/CheckBox"

const emptyForm = { name: "", academic_year: "", seats_available: "", is_active: false, results_published: false }

function errMsg(err, fallback) {
  return err?.errors?.[0]?.message || err?.message || fallback
}

export default function AdmissionCycleManager() {
  const { attemptWrite } = useAuth()

  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [toggleBusyId, setToggleBusyId] = useState(null)

  const fetchCycles = async () => {
    setLoading(true)
    try {
      const data = await listCycles()
      setCycles(data ?? [])
    } catch (err) {
      console.error("Failed to load admission cycles:", err)
      toast.error(errMsg(err, "Could not load admission cycles."))
      setCycles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCycles() }, [])

  const flashSaved = (msg) => {
    setSaved(msg)
    setTimeout(() => setSaved(null), 3000)
  }

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name?.trim()) e.name = "Cycle name is required."
    return e
  }

  const openAdd = () => {
    if (!attemptWrite("admissions")) return
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      await createCycle({
        name: form.name.trim(),
        academic_year: form.academic_year.trim() || undefined,
        seats_available: form.seats_available ? Number(form.seats_available) : undefined,
        is_active: form.is_active,
        results_published: form.results_published,
      })
      setModalOpen(false)
      flashSaved("Cycle created successfully.")
      fetchCycles()
    } catch (err) {
      console.error("Failed to create cycle:", err)
      setErrors({ save: errMsg(err, "Could not create the cycle.") })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (cycle) => {
    if (!attemptWrite("admissions")) return
    setToggleBusyId(cycle.id)
    try {
      await updateCycle(cycle.id, { is_active: !cycle.is_active })
      flashSaved(`Cycle "${cycle.name}" is now ${!cycle.is_active ? "active" : "inactive"}.`)
      fetchCycles()
    } catch (err) {
      console.error("Failed to toggle cycle active state:", err)
      toast.error(errMsg(err, "Could not update the cycle."))
    } finally {
      setToggleBusyId(null)
    }
  }

  const togglePublished = async (cycle) => {
    if (!attemptWrite("admissions")) return
    setToggleBusyId(cycle.id)
    try {
      await updateCycle(cycle.id, { results_published: !cycle.results_published })
      flashSaved(`Results ${!cycle.results_published ? "published" : "unpublished"} for "${cycle.name}".`)
      fetchCycles()
    } catch (err) {
      console.error("Failed to toggle results_published:", err)
      toast.error(errMsg(err, "Could not update the cycle."))
    } finally {
      setToggleBusyId(null)
    }
  }

  const columns = [
    {
      key: "name", label: "Cycle", sortable: false, width: 200,
      render: (row) => <span className="text-sm font-medium text-text">{row.name}</span>,
    },
    {
      key: "academic_year", label: "Academic Year", sortable: false, width: 140,
      render: (row) => <span className="text-sm text-muted">{row.academic_year ?? "—"}</span>,
    },
    {
      key: "seats_available", label: "Seats", sortable: false, width: 90,
      render: (row) => <span className="text-sm text-muted">{row.seats_available ?? "—"}</span>,
    },
    {
      key: "is_active", label: "Active", sortable: false, width: 130,
      render: (row) => (
        <button
          onClick={() => toggleActive(row)}
          disabled={toggleBusyId === row.id}
          className={`badge cursor-pointer disabled:opacity-50 ${row.is_active ? "badge-success" : "badge-info"}`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "results_published", label: "Results Published", sortable: false, width: 160,
      render: (row) => (
        <button
          onClick={() => togglePublished(row)}
          disabled={toggleBusyId === row.id}
          className={`badge cursor-pointer disabled:opacity-50 ${row.results_published ? "badge-success" : "badge-warning"}`}
        >
          {row.results_published ? "Published" : "Unpublished"}
        </button>
      ),
    },
    {
      key: "created_at", label: "Created", sortable: false, width: 150,
      render: (row) => (
        <span className="text-sm text-muted">
          {row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Admission Cycles</h1>
          <p className="page-subtitle">Manage admission cycles, seat counts, and result publication.</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={15} /> New Cycle
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success rounded-lg text-sm text-success font-medium">
          <CheckCircle size={15} />
          {saved}
        </div>
      )}

      <DataTable
        columns={columns}
        data={cycles}
        pageSize={20}
        loading={loading}
        emptyMessage="No admission cycles found."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Admission Cycle" width="max-w-lg">
        <div className="flex flex-col gap-5">
          <Input label="Cycle Name" required value={form.name} onChange={e => set("name", e.target.value)} error={errors.name} placeholder="e.g. Admissions 2026" />
          <Input label="Academic Year" value={form.academic_year} onChange={e => set("academic_year", e.target.value)} placeholder="e.g. 2026-27" />
          <Input label="Seats Available" type="number" value={form.seats_available} onChange={e => set("seats_available", e.target.value)} placeholder="e.g. 60" />
          <CheckBox label="Set as active cycle (deactivates all other cycles)" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />
          <CheckBox label="Results published" checked={form.results_published} onChange={e => set("results_published", e.target.checked)} />

          {errors.save && (
            <div className="flex items-center gap-2 text-xs text-danger">
              <AlertCircle size={13} className="shrink-0" />
              {errors.save}
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-border">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-60">
              {saving
                ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><Save size={14} /> Create Cycle</>
              }
            </button>
            <button onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
