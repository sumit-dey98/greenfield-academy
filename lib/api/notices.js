// Admin notices CRUD (requires the `cms` permission; enforced server-side too).
import { apiFetch } from "./client"

// GET /admin/notices -> Page_NoticeOut_
export function listNotices(params) {
  return apiFetch("/admin/notices", { query: params })
}

// POST /admin/notices -> NoticeOut (author_id is set server-side, id auto-generated)
export function createNotice(body) {
  return apiFetch("/admin/notices", { method: "POST", body })
}

// PUT /admin/notices/{id} -> NoticeOut
export function updateNotice(id, body) {
  return apiFetch(`/admin/notices/${id}`, { method: "PUT", body })
}

// DELETE /admin/notices/{id} -> 204
export function deleteNotice(id) {
  return apiFetch(`/admin/notices/${id}`, { method: "DELETE" })
}
