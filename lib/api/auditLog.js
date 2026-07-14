// Audit log (super_admin only — backend gates these on the `users` permission).
import { apiFetch } from "./client"

// GET /admin/audit-log -> Page_AuditLogOut_
// Filters: actor_id, action, resource_type, resource_id, created_from, created_to, limit, offset
export function listAuditLog(params) {
  return apiFetch("/admin/audit-log", { query: params })
}

// GET /admin/audit-log/{id} -> AuditLogOut
export function getAuditLogEntry(id) {
  return apiFetch(`/admin/audit-log/${id}`)
}

// DELETE /admin/audit-log/{id} -> 204
export function deleteAuditLogEntry(id) {
  return apiFetch(`/admin/audit-log/${id}`, { method: "DELETE" })
}

// POST /admin/audit-log/bulk-delete -> { deleted_count }
// body: { ids: [...] } or { before: <ISO datetime> } (at least one required)
export function bulkDeleteAuditLog(body) {
  return apiFetch("/admin/audit-log/bulk-delete", { method: "POST", body })
}
