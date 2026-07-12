// Admin subjects CRUD (academic permission).
import { apiFetch } from "./client"

// GET /admin/subjects -> array of SubjectOut
export function listSubjects(params) {
  return apiFetch("/admin/subjects", { query: params })
}
export function getSubject(id) {
  return apiFetch(`/admin/subjects/${id}`)
}
export function createSubject(body) {
  return apiFetch("/admin/subjects", { method: "POST", body })
}
export function updateSubject(id, body) {
  return apiFetch(`/admin/subjects/${id}`, { method: "PUT", body })
}
export function activateSubject(id) {
  return apiFetch(`/admin/subjects/${id}/activate`, { method: "POST" })
}
export function deactivateSubject(id) {
  return apiFetch(`/admin/subjects/${id}/deactivate`, { method: "POST" })
}
