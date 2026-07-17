'use client'

import { useEffect, useState } from "react"
import {
  listAuditLog, deleteAuditLogEntry, bulkDeleteAuditLog,
} from "@/lib/api/auditLog"
import { useAuth } from "@/context/AuthContext"
import { Trash2, RotateCcw, ShieldAlert, X } from "lucide-react"
import DataTable from "@/components/ui/DataTable"
import { toLimitOffset } from "@/components/ui/Pagination"
import SearchBox from "@/components/ui/SearchBox"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"
import CheckBox from "@/components/ui/CheckBox"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

const PAGE_SIZE = 20

const ACTION_OPTIONS = [
  { label: "All actions", value: "" },
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Set password", value: "set_password" },
]
const RESOURCE_OPTIONS = [
  { label: "All types", value: "" },
  { label: "User", value: "user" },
  { label: "Teacher", value: "teacher" },
  { label: "Student", value: "student" },
  { label: "Exam", value: "exam" },
  { label: "Result", value: "result" },
]

const actionBadge = {
  create: "badge-success",
  update: "badge-info",
  delete: "badge-danger",
  set_password: "badge-warning",
}

// dd/mm/yyyy -> yyyy-mm-dd
function toISO(ddmmyyyy) {
  if (!ddmmyyyy) return null
  const [d, m, y] = ddmmyyyy.split("/")
  return `${y}-${m}-${d}`
}

export default function AuditLogManager() {
  const { attemptWrite } = useAuth()

  const [action, setAction] = useState("")
  const [resourceType, setResourceType] = useState("")
  const [actorId, setActorId] = useState("")
  const [resourceId, setResourceId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Server-driven pagination.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [purgeOpen, setPurgeOpen] = useState(false)
  const [purging, setPurging] = useState(false)

  // Multi-select (bulk delete of chosen rows).
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Debounce the free-text id filters so we don't fire a request per keystroke.
  const [debouncedActor, setDebouncedActor] = useState("")
  const [debouncedResource, setDebouncedResource] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedActor(actorId.trim()), 350)
    return () => clearTimeout(t)
  }, [actorId])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedResource(resourceId.trim()), 350)
    return () => clearTimeout(t)
  }, [resourceId])

  // Any filter change resets to page 1.
  useEffect(() => { setPage(1) }, [
    action, resourceType, debouncedActor, debouncedResource, fromDate, toDate, pageSize,
  ])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = toLimitOffset(page, pageSize)
      if (action) params.action = action
      if (resourceType) params.resource_type = resourceType
      if (debouncedActor) params.actor_id = debouncedActor
      if (debouncedResource) params.resource_id = debouncedResource
      const fromISO = toISO(fromDate)
      const toISOv = toISO(toDate)
      if (fromISO) params.created_from = `${fromISO}T00:00:00`
      if (toISOv) params.created_to = `${toISOv}T23:59:59`

      const res = await listAuditLog(params)
      setEntries(res?.items ?? [])
      setTotal(res?.total ?? 0)
      setSelectedIds(new Set()) // selection doesn't carry across a data refresh
    } catch (err) {
      console.error("Failed to load audit log:", err)
      setEntries([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [page, pageSize, action, resourceType, debouncedActor, debouncedResource, fromDate, toDate])

  const resetFilters = () => {
    setAction(""); setResourceType(""); setActorId(""); setResourceId("")
    setFromDate(""); setToDate("")
  }

  const openDelete = (entry) => {
    if (!attemptWrite("users")) return
    setDeleteTarget(entry)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAuditLogEntry(deleteTarget.id)
      setDeleteTarget(null)
      fetchEntries()
    } catch (err) {
      console.error("Failed to delete audit entry:", err)
    } finally {
      setDeleting(false)
    }
  }

  const openPurge = () => {
    if (!attemptWrite("users")) return
    setPurgeOpen(true)
  }

  // Retention cleanup: delete everything older than the "To" date (end of that day).
  const handlePurge = async () => {
    const beforeISO = toISO(toDate)
    if (!beforeISO) return
    setPurging(true)
    try {
      await bulkDeleteAuditLog({ before: `${beforeISO}T23:59:59` })
      setPurgeOpen(false)
      setPage(1)
      fetchEntries()
    } catch (err) {
      console.error("Failed to purge audit log:", err)
    } finally {
      setPurging(false)
    }
  }

  const toggleRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allOnPageSelected = entries.length > 0 && entries.every(e => selectedIds.has(e.id))
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (entries.every(e => prev.has(e.id))) {
        const next = new Set(prev)
        entries.forEach(e => next.delete(e.id))
        return next
      }
      const next = new Set(prev)
      entries.forEach(e => next.add(e.id))
      return next
    })
  }

  const openBulkDelete = () => {
    if (!attemptWrite("users")) return
    if (selectedIds.size === 0) return
    setBulkOpen(true)
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      await bulkDeleteAuditLog({ ids: Array.from(selectedIds) })
      setBulkOpen(false)
      fetchEntries()
    } catch (err) {
      console.error("Failed to bulk-delete audit entries:", err)
    } finally {
      setBulkDeleting(false)
    }
  }

  const columns = [
    {
      key: "select",
      // Header checkbox toggles selection for every row on the current page.
      label: (
        <CheckBox checked={allOnPageSelected} onChange={toggleSelectAll} />
      ),
      sortable: false, width: 44,
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <CheckBox checked={selectedIds.has(row.id)} onChange={() => toggleRow(row.id)} />
        </div>
      ),
    },
    {
      key: "created_at", label: "Time", sortable: false, width: 170,
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
      key: "action", label: "Action", sortable: false, width: 130,
      render: (row) => (
        <span className={`badge capitalize ${actionBadge[row.action] ?? "badge-info"}`}>
          {String(row.action).replace("_", " ")}
        </span>
      ),
    },
    {
      key: "resource_type", label: "Type", sortable: false, width: 100,
      render: (row) => <span className="text-sm text-text capitalize">{row.resource_type}</span>,
    },
    {
      key: "resource_id", label: "Target", sortable: false, width: 220,
      render: (row) => (
        <div className="min-w-0">
          {row.resource_name ? (
            <>
              <p className="text-sm text-text truncate">{row.resource_name}</p>
              <p className="text-xs font-mono text-faint truncate">{row.resource_id}</p>
            </>
          ) : (
            // Unresolved (e.g. the target was deleted, or a junk seed row) — show the raw id.
            <p className="text-xs font-mono text-muted truncate">{row.resource_id}</p>
          )}
        </div>
      ),
    },
    {
      key: "actor_id", label: "Actor", sortable: false, width: 220,
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm text-text truncate">{row.actor_name ?? row.actor_id}</p>
          <p className="text-xs text-faint capitalize">
            {String(row.actor_role).replace("_", " ")}
            {row.actor_name ? ` · ${row.actor_id}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "actions", label: "Action", sortable: false, width: 60,
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); openDelete(row) }}
          className="p-1.5 rounded-md transition-colors hover:bg-surface-2 text-muted hover:text-danger"
          title="Delete entry"
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
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">
            Who changed what and when — account, exam, and result changes across the system.
          </p>
        </div>
        <button
          onClick={openPurge}
          disabled={!toISO(toDate)}
          className="btn btn-outline text-danger border-danger hover:border-danger hover:bg-danger hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-danger"
          title={toISO(toDate) ? "Delete all entries older than the 'To' date" : "Set a 'To' date to enable retention cleanup"}
        >
          <ShieldAlert size={15} /> Purge older than “To”
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <SearchBox
              placeholder="Filter by actor id..."
              value={actorId}
              onChange={e => setActorId(e.target.value)}
              onClear={() => setActorId("")}
            />
          </div>
          <div className="flex-1">
            <SearchBox
              placeholder="Filter by resource id..."
              value={resourceId}
              onChange={e => setResourceId(e.target.value)}
              onClear={() => setResourceId("")}
            />
          </div>
          <div className="w-full lg:w-44">
            <Select options={ACTION_OPTIONS} value={action} onChange={setAction} searchable={false} />
          </div>
          <div className="w-full lg:w-40">
            <Select options={RESOURCE_OPTIONS} value={resourceType} onChange={setResourceType} searchable={false} />
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

      {/* Bulk action bar — appears once rows are selected. */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary-light border border-primary/30 rounded-md">
          <span className="text-sm font-medium text-text">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button onClick={openBulkDelete} className="btn btn-danger text-xs !w-fit px-3 py-1.5">
              <Trash2 size={13} /> Delete selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-outline text-xs !w-fit px-3 py-1.5"
            >
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={entries}
        serverMode
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        emptyMessage="No audit log entries found."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Audit Entry"
        message={`Permanently delete this audit entry (${deleteTarget?.action} ${deleteTarget?.resource_type} ${deleteTarget?.resource_id})? Removing audit records is irreversible.`}
        confirmLabel="Delete Entry"
      />

      <ConfirmDialog
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onConfirm={handlePurge}
        loading={purging}
        title="Purge Old Audit Entries"
        message={`Permanently delete every audit entry dated on or before ${toDate}? This is a bulk, irreversible retention cleanup.`}
        confirmLabel="Purge Entries"
      />

      <ConfirmDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulkDelete}
        loading={bulkDeleting}
        title="Delete Selected Entries"
        message={`Permanently delete ${selectedIds.size} selected audit ${selectedIds.size === 1 ? "entry" : "entries"}? Removing audit records is irreversible.`}
        confirmLabel="Delete Selected"
      />

    </div>
  )
}
