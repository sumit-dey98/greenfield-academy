// Admin classes CRUD (academic permission).
import { apiFetch } from "./client"

// GET /admin/classes -> array of ClassOut
export function listClasses(params) {
  return apiFetch("/admin/classes", { query: params })
}
export function getClass(id) {
  return apiFetch(`/admin/classes/${id}`)
}
export function createClass(body) {
  return apiFetch("/admin/classes", { method: "POST", body })
}
export function updateClass(id, body) {
  return apiFetch(`/admin/classes/${id}`, { method: "PUT", body })
}
export function deleteClass(id) {
  return apiFetch(`/admin/classes/${id}`, { method: "DELETE" })
}
