'use client'

import { useEffect, useState } from "react"
import {
  listApplications, getApplication, updateApplicationStatus,
  scheduleExam, bulkScheduleExam, assignGrading, bulkAssignGrading,
  scheduleInterview, recordInterviewOutcome, bulkUpdateStatus, listCycles,
} from "@/lib/api/admissions"
import { listTeachers } from "@/lib/api/adminPeople"
import { listClasses } from "@/lib/api/classes"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import {
  Eye, CheckCircle, AlertCircle, X, FileText, ExternalLink,
} from "lucide-react"
import DataTable from "@/components/ui/DataTable"
import { toLimitOffset } from "@/components/ui/Pagination"
import SearchBox from "@/components/ui/SearchBox"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import Textarea from "@/components/ui/Textarea"
import DatePicker from "@/components/ui/DatePicker"
import Modal from "@/components/ui/Modal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import CheckBox from "@/components/ui/CheckBox"

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Screening Rejected", value: "screening_rejected" },
  { label: "Exam Scheduled", value: "exam_scheduled" },
  { label: "Exam Completed", value: "exam_completed" },
  { label: "Grading Assigned", value: "grading_assigned" },
  { label: "Graded", value: "graded" },
  { label: "Interview Scheduled", value: "interview_scheduled" },
  { label: "Interview Completed", value: "interview_completed" },
  { label: "Waitlisted", value: "waitlisted" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Withdrawn", value: "withdrawn" },
]

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.filter(o => o.value).map(o => [o.value, o.label])
)

const INTERVIEW_MODES = [
  { label: "In Person", value: "in_person" },
  { label: "Phone", value: "phone" },
  { label: "Video", value: "video" },
]

const INTERVIEW_OUTCOMES = [
  { label: "Recommend Accept", value: "recommend_accept" },
  { label: "Recommend Reject", value: "recommend_reject" },
  { label: "Recommend Waitlist", value: "recommend_waitlist" },
]

const admissionStatusBadge = {
  submitted: "badge-info",
  under_review: "badge-info",
  exam_scheduled: "badge-warning",
  exam_completed: "badge-warning",
  grading_assigned: "badge-warning",
  graded: "badge-warning",
  interview_scheduled: "badge-warning",
  interview_completed: "badge-warning",
  accepted: "badge-success",
  rejected: "badge-danger",
  screening_rejected: "badge-danger",
  withdrawn: "badge-danger",
  waitlisted: "badge-warning",
}

function StatusBadge({ status }) {
  return (
    <span className={`badge ${admissionStatusBadge[status] ?? "badge-info"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function formatDate(d) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function formatDateTime(d) {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

// dd/mm/yyyy -> yyyy-mm-dd
function toISO(ddmmyyyy) {
  if (!ddmmyyyy) return null
  const [d, m, y] = ddmmyyyy.split("/")
  return `${y}-${m}-${d}`
}

// yyyy-mm-dd -> dd/mm/yyyy
function fromISO(iso) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function errMsg(err, fallback) {
  return err?.errors?.[0]?.message || err?.message || fallback
}

export default function AdmissionsManager() {
  const { attemptWrite } = useAuth()

  const [applications, setApplications] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [cycles, setCycles] = useState([])
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [cycleFilter, setCycleFilter] = useState("")

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const [saved, setSaved] = useState(null) // transient success message

  // Detail modal
  const [detailId, setDetailId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkExamOpen, setBulkExamOpen] = useState(false)
  const [bulkGradingOpen, setBulkGradingOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(null) // status value or null
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkExamForm, setBulkExamForm] = useState({ exam_date: "", exam_time: "", venue: "", room: "" })
  const [bulkGradingTeacher, setBulkGradingTeacher] = useState("")
  const [bulkDecisionNotes, setBulkDecisionNotes] = useState("")

  useEffect(() => {
    listCycles().then(setCycles).catch(err => console.error("Failed to load cycles:", err))
    listTeachers({ limit: 200 }).then(page => setTeachers(page?.items ?? [])).catch(err => console.error("Failed to load teachers:", err))
    listClasses().then(setClasses).catch(err => console.error("Failed to load classes:", err))
  }, [])

  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter, classFilter, cycleFilter, pageSize])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const res = await listApplications({
        ...toLimitOffset(page, pageSize),
        q: debouncedSearch || undefined,
        status: statusFilter || undefined,
        applying_class: classFilter || undefined,
        cycle_id: cycleFilter || undefined,
      })
      setApplications(res?.items ?? [])
      setTotal(res?.total ?? 0)
      setSelectedIds(new Set())
    } catch (err) {
      console.error("Failed to load applications:", err)
      setApplications([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, statusFilter, classFilter, cycleFilter])

  const flashSaved = (msg) => {
    setSaved(msg)
    setTimeout(() => setSaved(null), 3000)
  }

  const cycleOptions = [
    { label: "All Cycles", value: "" },
    ...cycles.map(c => ({ label: `${c.name}${c.is_active ? " (active)" : ""}`, value: c.id })),
  ]
  const classOptions = [
    { label: "All Classes", value: "" },
    ...classes.map(c => ({ label: c.name, value: c.name })),
  ]
  const teacherOptions = teachers.map(t => ({ label: t.name, value: t.id }))

  // ---- Detail modal ----
  const openDetail = async (row) => {
    setDetailId(row.id)
    setDetail(null)
    setDetailLoading(true)
    setActionError(null)
    try {
      const data = await getApplication(row.id)
      setDetail(data)
    } catch (err) {
      console.error("Failed to load application detail:", err)
      setActionError(errMsg(err, "Could not load application detail."))
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailId(null)
    setDetail(null)
    setActionError(null)
  }

  const refreshDetail = async () => {
    if (!detailId) return
    try {
      const data = await getApplication(detailId)
      setDetail(data)
    } catch (err) {
      console.error("Failed to refresh application detail:", err)
    }
  }

  const runAction = async (fn, successMsg) => {
    if (!attemptWrite("admissions")) return
    setActionBusy(true)
    setActionError(null)
    try {
      await fn()
      await refreshDetail()
      fetchApplications()
      flashSaved(successMsg)
    } catch (err) {
      console.error("Admission action failed:", err)
      setActionError(errMsg(err, "Action failed."))
    } finally {
      setActionBusy(false)
    }
  }

  // ---- Bulk selection ----
  const toggleRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const allOnPageSelected = applications.length > 0 && applications.every(a => selectedIds.has(a.id))
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (applications.every(a => prev.has(a.id))) {
        const next = new Set(prev)
        applications.forEach(a => next.delete(a.id))
        return next
      }
      const next = new Set(prev)
      applications.forEach(a => next.add(a.id))
      return next
    })
  }

  const openBulkExam = () => {
    if (!attemptWrite("admissions")) return
    if (selectedIds.size === 0) return
    setBulkExamForm({ exam_date: "", exam_time: "", venue: "", room: "" })
    setBulkExamOpen(true)
  }
  const handleBulkExam = async () => {
    setBulkBusy(true)
    try {
      await bulkScheduleExam({
        application_ids: Array.from(selectedIds),
        exam_date: toISO(bulkExamForm.exam_date),
        exam_time: bulkExamForm.exam_time,
        venue: bulkExamForm.venue,
        room: bulkExamForm.room || undefined,
      })
      setBulkExamOpen(false)
      toast.success(`Exam scheduled for ${selectedIds.size} application(s).`)
      fetchApplications()
    } catch (err) {
      toast.error(errMsg(err, "Bulk exam scheduling failed."))
    } finally {
      setBulkBusy(false)
    }
  }

  const openBulkGrading = () => {
    if (!attemptWrite("admissions")) return
    if (selectedIds.size === 0) return
    setBulkGradingTeacher("")
    setBulkGradingOpen(true)
  }
  const handleBulkGrading = async () => {
    if (!bulkGradingTeacher) return
    setBulkBusy(true)
    try {
      await bulkAssignGrading(Array.from(selectedIds), bulkGradingTeacher)
      setBulkGradingOpen(false)
      toast.success(`Grading assigned for ${selectedIds.size} application(s).`)
      fetchApplications()
    } catch (err) {
      toast.error(errMsg(err, "Bulk grading assignment failed."))
    } finally {
      setBulkBusy(false)
    }
  }

  const openBulkStatus = (statusValue) => {
    if (!attemptWrite("admissions")) return
    if (selectedIds.size === 0) return
    setBulkDecisionNotes("")
    setBulkStatusOpen(statusValue)
  }
  const handleBulkStatus = async () => {
    setBulkBusy(true)
    try {
      const res = await bulkUpdateStatus(Array.from(selectedIds), bulkStatusOpen, bulkDecisionNotes || undefined)
      setBulkStatusOpen(null)
      const updatedCount = res?.updated?.length ?? 0
      const skipped = res?.skipped ?? []
      if (skipped.length > 0) {
        const reasons = [...new Set(skipped.map(s => s.reason))].join("; ")
        toast(`${updatedCount} updated, ${skipped.length} skipped — ${reasons}`, { icon: "⚠️", duration: 6000 })
      } else {
        toast.success(`${updatedCount} application(s) updated.`)
      }
      fetchApplications()
    } catch (err) {
      toast.error(errMsg(err, "Bulk status update failed."))
    } finally {
      setBulkBusy(false)
    }
  }

  const columns = [
    {
      key: "select",
      label: <CheckBox checked={allOnPageSelected} onChange={toggleSelectAll} />,
      sortable: false, width: 44,
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <CheckBox checked={selectedIds.has(row.id)} onChange={() => toggleRow(row.id)} />
        </div>
      ),
    },
    {
      key: "reference_number", label: "Reference", sortable: false, width: 140,
      render: (row) => <span className="text-sm font-mono font-medium text-text">{row.reference_number}</span>,
    },
    {
      key: "student_name", label: "Student", sortable: false, width: 200,
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-text truncate">{row.student_name}</p>
          <p className="text-xs text-faint truncate">{row.contact_email || row.contact_phone}</p>
        </div>
      ),
    },
    {
      key: "applying_class", label: "Class", sortable: false, width: 170,
      render: (row) => <span className="text-sm text-muted">{row.applying_class ?? "—"}</span>,
    },
    {
      key: "status", label: "Status", sortable: false, width: 160,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "entrance_score", label: "Score", sortable: false, width: 80,
      render: (row) => <span className="text-sm text-muted">{row.entrance_score ?? "—"}</span>,
    },
    {
      key: "created_at", label: "Submitted", sortable: false, width: 150,
      render: (row) => <span className="text-sm text-muted">{formatDate(row.created_at)}</span>,
    },
    {
      key: "actions", label: "Action", sortable: false, width: 60,
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); openDetail(row) }}
          className="p-1.5 rounded-md transition-colors hover:bg-surface-2 text-muted hover:text-text"
          title="View application"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">{total} applications on record.</p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success rounded-lg text-sm text-success font-medium">
          <CheckCircle size={15} />
          {saved}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBox
            placeholder="Search by name, email, phone, or reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClear={() => setSearch("")}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} searchable={false} />
        </div>
        <div className="w-full sm:w-56">
          <Select options={classOptions} value={classFilter} onChange={setClassFilter} searchable={false} />
        </div>
        <div className="w-full sm:w-52">
          <Select options={cycleOptions} value={cycleFilter} onChange={setCycleFilter} searchable={false} />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary-light border border-primary/30 rounded-md flex-wrap">
          <span className="text-sm font-medium text-text">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={openBulkExam} className="btn btn-outline text-xs !w-fit px-3 py-1.5">Schedule Exam</button>
            <button onClick={openBulkGrading} className="btn btn-outline text-xs !w-fit px-3 py-1.5">Assign Grading</button>
            <button onClick={() => openBulkStatus("accepted")} className="btn btn-outline text-xs !w-fit px-3 py-1.5 text-success border-success/40">Accept</button>
            <button onClick={() => openBulkStatus("rejected")} className="btn btn-outline text-xs !w-fit px-3 py-1.5 text-danger border-danger/40">Reject</button>
            <button onClick={() => openBulkStatus("waitlisted")} className="btn btn-outline text-xs !w-fit px-3 py-1.5">Waitlist</button>
            <button onClick={() => setSelectedIds(new Set())} className="btn btn-outline text-xs !w-fit px-3 py-1.5">
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={applications}
        serverMode
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        emptyMessage="No applications found."
      />

      {/* Detail modal */}
      <Modal open={!!detailId} onClose={closeDetail} title={detail ? `Application — ${detail.reference_number}` : "Application"} width="max-w-4xl">
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : (
          <ApplicationDetailBody
            detail={detail}
            teacherOptions={teacherOptions}
            actionBusy={actionBusy}
            actionError={actionError}
            runAction={runAction}
            attemptWrite={attemptWrite}
            setActionError={setActionError}
          />
        )}
      </Modal>

      {/* Bulk: schedule exam */}
      <Modal open={bulkExamOpen} onClose={() => setBulkExamOpen(false)} title="Bulk Schedule Exam" width="max-w-lg">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">Scheduling exam for {selectedIds.size} selected application(s).</p>
          <DatePicker label="Exam Date" required value={bulkExamForm.exam_date} onChange={v => setBulkExamForm(f => ({ ...f, exam_date: v }))} />
          <Input label="Exam Time" placeholder="HH:MM" value={bulkExamForm.exam_time} onChange={e => setBulkExamForm(f => ({ ...f, exam_time: e.target.value }))} />
          <Input label="Venue" placeholder="e.g. Main Hall" value={bulkExamForm.venue} onChange={e => setBulkExamForm(f => ({ ...f, venue: e.target.value }))} />
          <Input label="Room" placeholder="e.g. Room 204" value={bulkExamForm.room} onChange={e => setBulkExamForm(f => ({ ...f, room: e.target.value }))} />
          <div className="flex gap-3 pt-3 border-t border-border">
            <button onClick={handleBulkExam} disabled={bulkBusy || !bulkExamForm.exam_date} className="btn btn-primary disabled:opacity-60">
              {bulkBusy ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "Schedule"}
            </button>
            <button onClick={() => setBulkExamOpen(false)} className="btn btn-outline">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Bulk: assign grading */}
      <Modal open={bulkGradingOpen} onClose={() => setBulkGradingOpen(false)} title="Bulk Assign Grading" width="max-w-lg">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">Assigning grading for {selectedIds.size} selected application(s).</p>
          <Select label="Teacher" required options={teacherOptions} value={bulkGradingTeacher} onChange={setBulkGradingTeacher} placeholder="Select teacher" />
          <div className="flex gap-3 pt-3 border-t border-border">
            <button onClick={handleBulkGrading} disabled={bulkBusy || !bulkGradingTeacher} className="btn btn-primary disabled:opacity-60">
              {bulkBusy ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "Assign"}
            </button>
            <button onClick={() => setBulkGradingOpen(false)} className="btn btn-outline">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Bulk: status change confirm */}
      <ConfirmDialog
        open={!!bulkStatusOpen}
        onClose={() => setBulkStatusOpen(null)}
        onConfirm={handleBulkStatus}
        loading={bulkBusy}
        title={`Bulk ${STATUS_LABELS[bulkStatusOpen] ?? ""}`}
        message={
          <div className="flex flex-col gap-3 text-left">
            <p>Set status to &ldquo;{STATUS_LABELS[bulkStatusOpen]}&rdquo; for {selectedIds.size} selected application(s)? Applications not in a valid source state will be skipped.</p>
            <Textarea
              placeholder="Decision notes (optional)"
              rows={2}
              value={bulkDecisionNotes}
              onChange={e => setBulkDecisionNotes(e.target.value)}
            />
          </div>
        }
        confirmLabel="Confirm"
      />

    </div>
  )
}

// ---- Detail modal body: status-sensitive action sections ----

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <p className="text-sm text-text font-medium">{item.label}</p>
          <p className="text-sm text-faint">{item.value ?? "—"}</p>
        </div>
      ))}
    </div>
  )
}

function ApplicationDetailBody({ detail, teacherOptions, actionBusy, actionError, runAction, attemptWrite, setActionError }) {
  const [decisionNotes, setDecisionNotes] = useState("")
  const [examForm, setExamForm] = useState({ exam_date: "", exam_time: "", venue: "", room: "" })
  const [gradingTeacher, setGradingTeacher] = useState("")
  const [interviewForm, setInterviewForm] = useState({ interview_date: "", interview_time: "", mode: "in_person", interviewer_name: "", room: "", meeting_link: "", phone_number: "" })
  const [interviewOutcome, setInterviewOutcome] = useState({ interview_outcome: "", interview_notes: "" })

  const status = detail.status

  return (
    <div className="flex flex-col gap-6">

      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-danger rounded-lg text-sm text-danger">
          <AlertCircle size={15} className="shrink-0" />
          {actionError}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <StatusBadge status={status} />
        {detail.entrance_score != null && (
          <span className="text-sm font-semibold text-text">Score: {detail.entrance_score}</span>
        )}
      </div>

      {/* Personal / guardian info */}
      <div className="flex flex-col gap-3">
        <h4 className="text-lg font-bold text-text uppercase underline underline-offset-2">Student Information</h4>
        <InfoGrid items={[
          { label: "Full Name", value: detail.student_name },
          { label: "Date of Birth", value: formatDate(detail.dob) },
          { label: "Gender", value: detail.gender },
          { label: "Applying Class", value: detail.applying_class },
          { label: "Blood Group", value: detail.blood_group },
          { label: "Previous School", value: detail.previous_school },
          { label: "Contact Email", value: detail.contact_email },
          { label: "Contact Phone", value: detail.contact_phone },
        ]} />
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-lg font-bold text-text uppercase underline underline-offset-2">Guardian Information</h4>
        <InfoGrid items={[
          { label: "Guardian Name", value: detail.guardian_name },
          { label: "Relationship", value: detail.guardian_relationship },
          { label: "Guardian Phone", value: detail.guardian_phone },
          { label: "Guardian Email", value: detail.guardian_email },
          { label: "Occupation", value: detail.guardian_occupation },
          { label: "Address", value: detail.address },
        ]} />
      </div>

      {(detail.medical_conditions || detail.extracurricular || detail.notes) && (
        <div className="flex flex-col gap-3">
          <h4 className="text-lg font-bold text-text uppercase underline underline-offset-2">Additional Information</h4>
          <InfoGrid items={[
            { label: "Medical Conditions", value: detail.medical_conditions },
            { label: "Extracurricular", value: detail.extracurricular },
            { label: "Notes", value: detail.notes },
          ]} />
        </div>
      )}

      {/* Documents */}
      <div className="flex flex-col gap-3">
        <h4 className="text-lg font-bold text-text uppercase underline underline-offset-2">Documents</h4>
        {detail.documents?.length ? (
          <div className="flex flex-col gap-2">
            {detail.documents.map(doc => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-sm bg-surface-2 text-sm text-text hover:text-primary transition-colors no-underline"
              >
                <FileText size={14} className="text-faint shrink-0" />
                <span className="flex-1 truncate">{doc.file_name || doc.doc_type || "Document"}</span>
                <ExternalLink size={13} className="text-faint shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No documents uploaded.</p>
        )}
      </div>

      <div className="border-t border-border pt-5 flex flex-col gap-5">
        <h4 className="text-lg font-bold text-text uppercase underline underline-offset-2">Actions</h4>

        {/* under_review: screen-reject or schedule exam */}
        {status === "under_review" && (
          <div className="flex flex-col gap-5">
            <div className="card flex flex-col gap-3">
              <p className="text-sm font-medium text-text">Schedule Entrance Exam</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <DatePicker label="Exam Date" required value={examForm.exam_date} onChange={v => setExamForm(f => ({ ...f, exam_date: v }))} />
                <Input label="Exam Time" placeholder="HH:MM" value={examForm.exam_time} onChange={e => setExamForm(f => ({ ...f, exam_time: e.target.value }))} />
                <Input label="Venue" placeholder="e.g. Main Hall" value={examForm.venue} onChange={e => setExamForm(f => ({ ...f, venue: e.target.value }))} />
                <Input label="Room" placeholder="e.g. Room 204" value={examForm.room} onChange={e => setExamForm(f => ({ ...f, room: e.target.value }))} />
              </div>
              <button
                onClick={() => runAction(() => scheduleExam(detail.id, {
                  exam_date: toISO(examForm.exam_date),
                  exam_time: examForm.exam_time,
                  venue: examForm.venue,
                  room: examForm.room || undefined,
                }), "Exam scheduled.")}
                disabled={actionBusy || !examForm.exam_date}
                className="btn btn-primary w-fit disabled:opacity-60"
              >
                Schedule Exam
              </button>
            </div>

            <div className="card flex flex-col gap-3">
              <p className="text-sm font-medium text-text">Screening Decision</p>
              <Textarea placeholder="Decision notes (optional)" rows={2} value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)} />
              <button
                onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "screening_rejected", decision_notes: decisionNotes || undefined }), "Application rejected at screening.")}
                disabled={actionBusy}
                className="btn btn-outline w-fit text-danger border-danger/40 disabled:opacity-60"
              >
                Reject at Screening
              </button>
            </div>
          </div>
        )}

        {/* exam_scheduled: show schedule + mark completed */}
        {status === "exam_scheduled" && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm font-medium text-text">Exam Schedule</p>
            <InfoGrid items={[
              { label: "Exam Date", value: formatDate(detail.exam_schedule?.exam_date) },
              { label: "Exam Time", value: detail.exam_schedule?.exam_time },
              { label: "Venue", value: detail.exam_schedule?.venue },
              { label: "Room", value: detail.exam_schedule?.room },
              { label: "Roll Number", value: detail.exam_schedule?.roll_number },
            ]} />
            <button
              onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "exam_completed" }), "Marked exam completed.")}
              disabled={actionBusy}
              className="btn btn-primary w-fit disabled:opacity-60"
            >
              Mark Exam Completed
            </button>
          </div>
        )}

        {/* exam_completed: assign grading */}
        {status === "exam_completed" && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm font-medium text-text">Assign Grading</p>
            <Select label="Teacher" required options={teacherOptions} value={gradingTeacher} onChange={setGradingTeacher} placeholder="Select teacher" />
            <button
              onClick={() => runAction(() => assignGrading(detail.id, gradingTeacher), "Grading assigned.")}
              disabled={actionBusy || !gradingTeacher}
              className="btn btn-primary w-fit disabled:opacity-60"
            >
              Assign Grading
            </button>
          </div>
        )}

        {/* grading_assigned: waiting */}
        {status === "grading_assigned" && (
          <div className="card">
            <p className="text-sm text-muted">
              Waiting on {detail.grading_assignment?.teacher_name ?? "the assigned teacher"} to submit the exam grade.
              This transition only happens via the teacher&apos;s own grading submission.
            </p>
          </div>
        )}

        {/* graded: schedule interview OR waitlist/reject */}
        {status === "graded" && (
          <div className="flex flex-col gap-5">
            <div className="card flex flex-col gap-3">
              <p className="text-sm font-medium text-text">Schedule Interview</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DatePicker label="Interview Date" required value={interviewForm.interview_date} onChange={v => setInterviewForm(f => ({ ...f, interview_date: v }))} />
                <Input label="Interview Time" placeholder="HH:MM" value={interviewForm.interview_time} onChange={e => setInterviewForm(f => ({ ...f, interview_time: e.target.value }))} />
                <Select label="Mode" options={INTERVIEW_MODES} value={interviewForm.mode} onChange={v => setInterviewForm(f => ({ ...f, mode: v }))} searchable={false} clearable={false} />
                <Input label="Interviewer Name" value={interviewForm.interviewer_name} onChange={e => setInterviewForm(f => ({ ...f, interviewer_name: e.target.value }))} />
                {interviewForm.mode === "in_person" && (
                  <Input label="Room" placeholder="e.g. Room 12, Admin Building" value={interviewForm.room} onChange={e => setInterviewForm(f => ({ ...f, room: e.target.value }))} />
                )}
                {interviewForm.mode === "video" && (
                  <Input label="Meeting Link" placeholder="https://meet.google.com/..." value={interviewForm.meeting_link} onChange={e => setInterviewForm(f => ({ ...f, meeting_link: e.target.value }))} />
                )}
                {interviewForm.mode === "phone" && (
                  <Input label="Phone Number" placeholder="+880-2-9876543" value={interviewForm.phone_number} onChange={e => setInterviewForm(f => ({ ...f, phone_number: e.target.value }))} />
                )}
              </div>
              <button
                onClick={() => runAction(() => scheduleInterview(detail.id, {
                  interview_date: toISO(interviewForm.interview_date),
                  interview_time: interviewForm.interview_time,
                  mode: interviewForm.mode,
                  interviewer_name: interviewForm.interviewer_name || undefined,
                  room: interviewForm.mode === "in_person" ? (interviewForm.room || undefined) : undefined,
                  meeting_link: interviewForm.mode === "video" ? (interviewForm.meeting_link || undefined) : undefined,
                  phone_number: interviewForm.mode === "phone" ? (interviewForm.phone_number || undefined) : undefined,
                }), "Interview scheduled.")}
                disabled={actionBusy || !interviewForm.interview_date}
                className="btn btn-primary w-fit disabled:opacity-60"
              >
                Schedule Interview
              </button>
            </div>

            <div className="card flex flex-col gap-3">
              <p className="text-sm font-medium text-text">Direct Decision</p>
              <Textarea placeholder="Decision notes (optional)" rows={2} value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)} />
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "waitlisted", decision_notes: decisionNotes || undefined }), "Waitlisted.")}
                  disabled={actionBusy}
                  className="btn btn-outline w-fit disabled:opacity-60"
                >
                  Waitlist
                </button>
                <button
                  onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "rejected", decision_notes: decisionNotes || undefined }), "Rejected.")}
                  disabled={actionBusy}
                  className="btn btn-outline w-fit text-danger border-danger/40 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* interview_scheduled: show interview details + outcome form */}
        {status === "interview_scheduled" && (
          <div className="card flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-text mb-2">Interview Details</p>
              <InfoGrid items={[
                { label: "Interview Date", value: formatDate(detail.interview?.interview_date) },
                { label: "Interview Time", value: detail.interview?.interview_time },
                { label: "Mode", value: detail.interview?.mode },
                { label: "Interviewer", value: detail.interview?.interviewer_name },
                ...(detail.interview?.mode === "in_person" ? [{ label: "Room", value: detail.interview?.room }] : []),
                ...(detail.interview?.mode === "video" ? [{ label: "Meeting Link", value: detail.interview?.meeting_link }] : []),
                ...(detail.interview?.mode === "phone" ? [{ label: "Phone Number", value: detail.interview?.phone_number }] : []),
              ]} />
            </div>
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-sm font-medium text-text">Record Interview Outcome</p>
              <Select
                label="Outcome" required options={INTERVIEW_OUTCOMES}
                value={interviewOutcome.interview_outcome}
                onChange={v => setInterviewOutcome(f => ({ ...f, interview_outcome: v }))}
                placeholder="Select outcome"
              />
              <Textarea
                label="Interview Notes"
                rows={2}
                value={interviewOutcome.interview_notes}
                onChange={e => setInterviewOutcome(f => ({ ...f, interview_notes: e.target.value }))}
              />
              <button
                onClick={() => runAction(() => recordInterviewOutcome(detail.id, {
                  interview_outcome: interviewOutcome.interview_outcome,
                  interview_notes: interviewOutcome.interview_notes || undefined,
                }), "Interview outcome recorded.")}
                disabled={actionBusy || !interviewOutcome.interview_outcome}
                className="btn btn-primary w-fit disabled:opacity-60"
              >
                Record Outcome
              </button>
            </div>
          </div>
        )}

        {/* interview_completed: final decision */}
        {status === "interview_completed" && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm font-medium text-text">Final Decision</p>
            {detail.interview_outcome && (
              <p className="text-xs text-muted">Interview recommendation: <span className="font-medium text-text">{detail.interview_outcome.replace("recommend_", "")}</span></p>
            )}
            <Textarea placeholder="Decision notes (optional)" rows={2} value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "accepted", decision_notes: decisionNotes || undefined }), "Accepted.")}
                disabled={actionBusy}
                className="btn btn-primary w-fit disabled:opacity-60"
              >
                Accept
              </button>
              <button
                onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "waitlisted", decision_notes: decisionNotes || undefined }), "Waitlisted.")}
                disabled={actionBusy}
                className="btn btn-outline w-fit disabled:opacity-60"
              >
                Waitlist
              </button>
              <button
                onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "rejected", decision_notes: decisionNotes || undefined }), "Rejected.")}
                disabled={actionBusy}
                className="btn btn-outline w-fit text-danger border-danger/40 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* waitlisted: accept/reject */}
        {status === "waitlisted" && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm font-medium text-text">Waitlist Decision</p>
            <Textarea placeholder="Decision notes (optional)" rows={2} value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "accepted", decision_notes: decisionNotes || undefined }), "Accepted.")}
                disabled={actionBusy}
                className="btn btn-primary w-fit disabled:opacity-60"
              >
                Accept
              </button>
              <button
                onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "rejected", decision_notes: decisionNotes || undefined }), "Rejected.")}
                disabled={actionBusy}
                className="btn btn-outline w-fit text-danger border-danger/40 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* terminal states */}
        {["accepted", "rejected", "screening_rejected", "withdrawn"].includes(status) && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm text-muted">
              This application has reached a terminal state ({STATUS_LABELS[status] ?? status}).
              {detail.decision_notes && <><br /><span className="text-text">Notes: {detail.decision_notes}</span></>}
            </p>
            {status !== "withdrawn" && (
              <button
                onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "withdrawn" }), "Marked as withdrawn.")}
                disabled={actionBusy}
                className="btn btn-outline w-fit disabled:opacity-60"
              >
                Mark Withdrawn
              </button>
            )}
          </div>
        )}

        {/* submitted: initial move to under_review */}
        {status === "submitted" && (
          <div className="card flex flex-col gap-3">
            <p className="text-sm text-muted">This application hasn&apos;t started review yet.</p>
            <button
              onClick={() => runAction(() => updateApplicationStatus(detail.id, { status: "under_review" }), "Moved to under review.")}
              disabled={actionBusy}
              className="btn btn-primary w-fit disabled:opacity-60"
            >
              Start Review
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
