'use client'

import { useEffect, useState, useCallback } from "react"
import { listResetRequests, acceptResetRequest } from "@/lib/api/resetRequests"
import { useAuth } from "@/context/AuthContext"
import { Check, RotateCcw } from "lucide-react"
import DataTable from "@/components/ui/DataTable"
import SearchBox from "@/components/ui/SearchBox"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

const ROLE_OPTIONS = [
  { label: "All roles", value: "" },
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
]
const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
]
const ACTIVE_OPTIONS = [
  { label: "Active only", value: "true" },
  { label: "Inactive only", value: "false" },
  { label: "All", value: "" },
]

// dd/mm/yyyy -> yyyy-mm-dd
function toISO(ddmmyyyy) {
  if (!ddmmyyyy) return null
  const [d, m, y] = ddmmyyyy.split("/")
  return `${y}-${m}-${d}`
}

export default function PasswordResetRequestsManager() {
  const { attemptWrite } = useAuth()

  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [active, setActive] = useState("true") // default to the active queue
  const [email, setEmail] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const [confirmTarget, setConfirmTarget] = useState(null)
  const [accepting, setAccepting] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 200, offset: 0 }
      if (role) params.role = role
      if (status) params.status = status
      if (active !== "") params.active = active
      if (email.trim()) params.email = email.trim()
      const fromISO = toISO(fromDate)
      const toISOv = toISO(toDate)
      if (fromISO) params.created_from = `${fromISO}T00:00:00`
      if (toISOv) params.created_to = `${toISOv}T23:59:59`

      const page = await listResetRequests(params)
      setRequests(page?.items ?? [])
    } catch (err) {
      console.error("Failed to load reset requests:", err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [role, status, active, email, fromDate, toDate])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const resetFilters = () => {
    setRole(""); setStatus(""); setActive("true"); setEmail(""); setFromDate(""); setToDate("")
  }

  const openAccept = (req) => {
    if (!attemptWrite("academic")) return
    setConfirmTarget(req)
  }

  const handleAccept = async () => {
    if (!confirmTarget) return
    setAccepting(true)
    try {
      await acceptResetRequest(confirmTarget.id)
      setConfirmTarget(null)
      fetchRequests()
    } catch (err) {
      console.error("Failed to accept request:", err)
    } finally {
      setAccepting(false)
    }
  }

  const columns = [
    {
      key: "email", label: "Email", sortable: true, width: 320,
      render: (row) => <span className="text-sm font-medium text-text truncate">{row.email}</span>,
    },
    {
      key: "role", label: "Role", sortable: true, width: 110,
      render: (row) => <span className="badge badge-info capitalize">{row.role}</span>,
    },
    {
      key: "status", label: "Status", sortable: true, width: 120,
      render: (row) => (
        <span className={`badge capitalize ${row.status === "accepted" ? "badge-success" : "badge-warning"}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "is_active", label: "Active", sortable: true, width: 110,
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.is_active ? "text-success" : "text-faint"}`}>
          <span className={`w-2 h-2 rounded-full ${row.is_active ? "bg-success" : "bg-faint"}`} />
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "created_at", label: "Requested", sortable: true, width: 180,
      render: (row) => (
        <span className="text-sm text-muted">
          {row.created_at
            ? new Date(row.created_at).toLocaleString("en-GB", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "actions", label: "Action", sortable: false, width: 130,
      render: (row) => (
        row.is_active ? (
          <button
            onClick={(e) => { e.stopPropagation(); openAccept(row) }}
            className="btn btn-primary text-xs !w-fit px-3 py-1.5"
          >
            <Check size={13} /> Accept
          </button>
        ) : (
          <span className="text-xs text-faint">Resolved</span>
        )
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Password Reset Requests</h1>
        <p className="page-subtitle">
          Students and teachers who asked for a password reset. Accepting clears their
          password so they can set a new one at login.
        </p>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <SearchBox
              placeholder="Search by email..."
              value={email}
              onChange={e => setEmail(e.target.value)}
              onClear={() => setEmail("")}
            />
          </div>
          <div className="w-full lg:w-40">
            <Select options={ROLE_OPTIONS} value={role} onChange={setRole} searchable={false} />
          </div>
          <div className="w-full lg:w-44">
            <Select options={STATUS_OPTIONS} value={status} onChange={setStatus} searchable={false} />
          </div>
          <div className="w-full lg:w-44">
            <Select options={ACTIVE_OPTIONS} value={active} onChange={setActive} searchable={false} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="w-full sm:w-48">
            <DatePicker label="From" value={fromDate} onChange={setFromDate} />
          </div>
          <div className="w-full sm:w-48">
            <DatePicker label="To" value={toDate} onChange={setToDate} />
          </div>
          <button onClick={resetFilters} className="btn btn-outline h-10">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <DataTable
        key={`${role}-${status}-${active}-${email}-${fromDate}-${toDate}`}
        columns={columns}
        data={requests}
        pageSize={20}
        loading={loading}
        emptyMessage="No reset requests found."
      />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleAccept}
        loading={accepting}
        title="Accept Reset Request"
        message={`Accept the reset request for ${confirmTarget?.email}? This clears their password — they'll set a new one at login — and removes this request from the active queue.`}
        confirmLabel="Accept & Clear Password"
      />

    </div>
  )
}
