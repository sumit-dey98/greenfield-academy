// Admin-tier account CRUD (users permission; super_admin sees all, admin limited to editors).
import { apiFetch } from "./client"

// GET /admin/users -> array of UserOut
export function listUsers(params) {
  return apiFetch("/admin/users", { query: params })
}
export function getUser(id) {
  return apiFetch(`/admin/users/${id}`)
}
export function createUser(body) {
  return apiFetch("/admin/users", { method: "POST", body })
}
export function updateUser(id, body) {
  return apiFetch(`/admin/users/${id}`, { method: "PUT", body })
}
export function deleteUser(id) {
  return apiFetch(`/admin/users/${id}`, { method: "DELETE" })
}
// POST /admin/users/{id}/set-password  (admin accounts can still be set directly)
export function setUserPassword(id, newPassword) {
  return apiFetch(`/admin/users/${id}/set-password`, { method: "POST", body: { new_password: newPassword } })
}
