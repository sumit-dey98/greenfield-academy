'use client'

import { useEffect, useState } from "react"
import { listMyGradingAssignments, submitGradingResult } from "@/lib/api/teacherAdmissionGrading"
import { ClipboardList, CheckCircle2, Hourglass, Save, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import DataTable from "@/components/ui/DataTable"
import { toLimitOffset } from "@/components/ui/Pagination"
import Input from "@/components/ui/Input"
import Textarea from "@/components/ui/Textarea"

const PAGE_SIZE = 20

function errMsg(err, fallback) {
  return err?.errors?.[0]?.message || err?.message || fallback
}

function GradingForm({ row, onSubmitted }) {
  const [marks, setMarks] = useState("")
  const [total, setTotal] = useState("100")
  const [remarks, setRemarks] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (marks === "" || Number.isNaN(Number(marks))) {
      setError("Enter valid marks.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await submitGradingResult(row.application_id, {
        marks: Number(marks),
        total: total ? Number(total) : 100,
        remarks: remarks || undefined,
      })
      onSubmitted(updated)
    } catch (err) {
      console.error("Failed to submit grading result:", err)
      setError(errMsg(err, "Could not submit the grading result."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-24">
          <Input placeholder="Marks" type="number" value={marks} onChange={e => setMarks(e.target.value)} />
        </div>
        <span className="text-sm text-muted">/</span>
        <div className="w-24">
          <Input placeholder="Total" type="number" value={total} onChange={e => setTotal(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[160px]">
          <Input placeholder="Remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} />
        </div>
        <button onClick={handleSubmit} disabled={saving} className="btn btn-primary text-xs !w-fit px-3 py-1.5 disabled:opacity-60">
          {saving
            ? <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <><Save size={13} /> Submit</>
          }
        </button>
      </div>
      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

export default function AdmissionGradingList() {
  const [assignments, setAssignments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const res = await listMyGradingAssignments(toLimitOffset(page, pageSize))
      setAssignments(res?.items ?? [])
      setTotal(res?.total ?? 0)
    } catch (err) {
      console.error("Failed to load grading assignments:", err)
      toast.error(errMsg(err, "Could not load your grading assignments."))
      setAssignments([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [page, pageSize])

  const handleSubmitted = (updated) => {
    setAssignments(prev => prev.map(a => a.application_id === updated.application_id ? updated : a))
  }

  const assignedCount = assignments.filter(a => a.status === "assigned").length
  const gradedCount = assignments.filter(a => a.status === "graded").length

  const columns = [
    {
      key: "roll_number", label: "Roll No.", sortable: false, width: 130,
      render: (row) => <span className="text-sm font-mono font-medium text-text">{row.roll_number}</span>,
    },
    {
      key: "applying_class", label: "Class", sortable: false, width: 170,
      render: (row) => <span className="text-sm text-muted">{row.applying_class ?? "—"}</span>,
    },
    {
      key: "exam_date", label: "Exam Date", sortable: false, width: 140,
      render: (row) => (
        <span className="text-sm text-muted">
          {row.exam_date ? new Date(row.exam_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </span>
      ),
    },
    {
      key: "status", label: "Status", sortable: false, width: 110,
      render: (row) => (
        <span className={`badge ${row.status === "graded" ? "badge-success" : "badge-warning"}`}>
          {row.status === "graded" ? "Graded" : "Assigned"}
        </span>
      ),
    },
    {
      key: "grading", label: "Marks / Grading", sortable: false, width: 420,
      render: (row) => {
        if (row.status === "graded") {
          return (
            <span className="text-sm font-semibold text-text">
              {row.marks ?? "—"}{row.total ? ` / ${row.total}` : ""}
            </span>
          )
        }
        return <GradingForm row={row} onSubmitted={handleSubmitted} />
      },
    },
  ]

  if (loading && assignments.length === 0) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Admission Grading</h1>
        <p className="page-subtitle">
          Blind entrance-exam grading — no applicant identity is shown, only roll number and class.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 justify-between mb-3">
            <span className="text-sm font-medium text-muted">Total Assignments</span>
            <ClipboardList size={18} className="text-primary" />
          </div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 justify-between mb-3">
            <span className="text-sm font-medium text-muted">Pending</span>
            <Hourglass size={18} className="text-warning" />
          </div>
          <div className="stat-value">{assignedCount}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 justify-between mb-3">
            <span className="text-sm font-medium text-muted">Graded</span>
            <CheckCircle2 size={18} className="text-success" />
          </div>
          <div className="stat-value">{gradedCount}</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        serverMode
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        emptyMessage="No grading assignments yet."
      />

    </div>
  )
}
