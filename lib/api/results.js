// Admin results (academic permission).
import { apiFetch } from "./client"

// GET /admin/results -> Page_ResultAdminOut_
export function listResults(params) {
  return apiFetch("/admin/results", { query: params })
}
// POST /admin/results -> ResultOut (upsert by student+subject+exam; grade computed server-side)
export function upsertResult(body) {
  return apiFetch("/admin/results", { method: "POST", body })
}
// DELETE /admin/results/{id} -> 204
export function deleteResult(id) {
  return apiFetch(`/admin/results/${id}`, { method: "DELETE" })
}
