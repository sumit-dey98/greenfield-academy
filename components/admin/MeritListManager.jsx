'use client'

import { useEffect, useState } from "react"
import { getMeritList, listCycles, updateApplicationStatus, bulkUpdateStatus } from "@/lib/api/admissions"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import { Award, CheckCircle } from "lucide-react"
import DataTable from "@/components/ui/DataTable"
import Select from "@/components/ui/Select"

const CLASSES = [
  "Class 9 - Section A",
  "Class 9 - Section B",
  "Class 10 - Section A",
  "Class 10 - Section B",
  "Class 11 - Science",
  "Class 11 - Commerce",
]

const statusBadge = {
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

function errMsg(err, fallback) {
  return err?.errors?.[0]?.message || err?.message || fallback
}

export default function MeritListManager() {
  const { attemptWrite } = useAuth()

  const [cycles, setCycles] = useState([])
  const [cycleId, setCycleId] = useState("")
  const [classFilter, setClassFilter] = useState("")

  const [items, setItems] = useState([])
  const [seatsAvailable, setSeatsAvailable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    listCycles()
      .then(data => {
        setCycles(data ?? [])
        const active = (data ?? []).find(c => c.is_active)
        if (active) setCycleId(active.id)
        else if (data?.length) setCycleId(data[0].id)
      })
      .catch(err => console.error("Failed to load cycles:", err))
  }, [])

  const fetchMeritList = async () => {
    if (!cycleId) { setItems([]); setSeatsAvailable(null); setLoading(false); return }
    setLoading(true)
    try {
      const res = await getMeritList(cycleId, { applying_class: classFilter || undefined })
      setItems(res?.items ?? [])
      setSeatsAvailable(res?.seats_available ?? null)
    } catch (err) {
      console.error("Failed to load merit list:", err)
      setItems([])
      setSeatsAvailable(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeritList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId, classFilter])

  const cycleOptions = cycles.map(c => ({ label: `${c.name}${c.is_active ? " (active)" : ""}`, value: c.id }))
  const classOptions = [{ label: "All Classes", value: "" }, ...CLASSES.map(c => ({ label: c, value: c }))]

  const decide = async (applicationId, status) => {
    if (!attemptWrite("admissions")) return
    setBusyId(applicationId)
    try {
      await updateApplicationStatus(applicationId, { status })
      toast.success(`Application marked as ${status}.`)
      fetchMeritList()
    } catch (err) {
      toast.error(errMsg(err, "Could not update application status."))
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: "rank", label: "Rank", sortable: false, width: 70,
      render: (row) => {
        const withinCutoff = seatsAvailable != null && row.rank <= seatsAvailable
        return (
          <span className={`text-sm font-semibold ${withinCutoff ? "text-success" : "text-muted"}`}>
            #{row.rank}
          </span>
        )
      },
    },
    {
      key: "reference_number", label: "Reference", sortable: false, width: 140,
      render: (row) => <span className="text-sm font-mono text-text">{row.reference_number}</span>,
    },
    {
      key: "student_name", label: "Student", sortable: false, width: 200,
      render: (row) => {
        const withinCutoff = seatsAvailable != null && row.rank <= seatsAvailable
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text truncate">{row.student_name}</span>
            {withinCutoff && <span className="badge badge-success text-[10px]">within cutoff</span>}
          </div>
        )
      },
    },
    {
      key: "applying_class", label: "Class", sortable: false, width: 170,
      render: (row) => <span className="text-sm text-muted">{row.applying_class ?? "—"}</span>,
    },
    {
      key: "entrance_score", label: "Score", sortable: false, width: 80,
      render: (row) => <span className="text-sm font-medium text-text">{row.entrance_score ?? "—"}</span>,
    },
    {
      key: "status", label: "Status", sortable: false, width: 140,
      render: (row) => <span className={`badge ${statusBadge[row.status] ?? "badge-info"}`}>{row.status.replace(/_/g, " ")}</span>,
    },
    {
      key: "interview_outcome", label: "Interview", sortable: false, width: 150,
      render: (row) => (
        <span className="text-sm text-muted capitalize">
          {row.interview_outcome ? row.interview_outcome.replace("recommend_", "") : "—"}
        </span>
      ),
    },
    {
      key: "actions", label: "Decision", sortable: false, width: 220,
      render: (row) => {
        const busy = busyId === row.application_id
        const disabled = busy || ["accepted", "rejected", "withdrawn"].includes(row.status)
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => decide(row.application_id, "accepted")}
              disabled={disabled}
              className="btn btn-outline text-xs !w-fit px-2 py-1 text-success border-success/40 disabled:opacity-40"
            >
              Accept
            </button>
            <button
              onClick={() => decide(row.application_id, "waitlisted")}
              disabled={disabled}
              className="btn btn-outline text-xs !w-fit px-2 py-1 disabled:opacity-40"
            >
              Waitlist
            </button>
            <button
              onClick={() => decide(row.application_id, "rejected")}
              disabled={disabled}
              className="btn btn-outline text-xs !w-fit px-2 py-1 text-danger border-danger/40 disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Merit List</h1>
          <p className="page-subtitle">Ranked applicants by entrance score for the selected cycle.</p>
        </div>
        {seatsAvailable != null && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-light border border-primary/30 rounded-lg">
            <Award size={15} className="text-primary" />
            <span className="text-sm font-semibold text-primary">{seatsAvailable} seats available</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-64">
          <Select label="Cycle" options={cycleOptions} value={cycleId} onChange={setCycleId} placeholder="Select cycle" searchable={false} />
        </div>
        <div className="w-full sm:w-56">
          <Select label="Applying Class" options={classOptions} value={classFilter} onChange={setClassFilter} searchable={false} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        pageSize={50}
        loading={loading}
        emptyMessage="No ranked applicants found for this cycle."
      />

    </div>
  )
}
