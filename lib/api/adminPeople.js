// Admin CRUD for student & teacher accounts (academic permission).
// Note: admins CANNOT set passwords directly — only clear them (the reset flow).
import { apiFetch } from "./client"

// ---- Students ----
// GET /admin/students -> Page_StudentAdminOut_
export function listStudents(params) {
  return apiFetch("/admin/students", { query: params })
}
export function getStudent(id) {
  return apiFetch(`/admin/students/${id}`)
}
export function createStudent(body) {
  return apiFetch("/admin/students", { method: "POST", body })
}
export function updateStudent(id, body) {
  return apiFetch(`/admin/students/${id}`, { method: "PUT", body })
}
export function deleteStudent(id) {
  return apiFetch(`/admin/students/${id}`, { method: "DELETE" })
}
export function clearStudentPassword(id) {
  return apiFetch(`/admin/students/${id}/clear-password`, { method: "POST" })
}

// ---- Teachers ----
// GET /admin/teachers -> Page_TeacherAdminOut_
export function listTeachers(params) {
  return apiFetch("/admin/teachers", { query: params })
}
export function getTeacher(id) {
  return apiFetch(`/admin/teachers/${id}`)
}
export function createTeacher(body) {
  return apiFetch("/admin/teachers", { method: "POST", body })
}
export function updateTeacher(id, body) {
  return apiFetch(`/admin/teachers/${id}`, { method: "PUT", body })
}
export function deleteTeacher(id) {
  return apiFetch(`/admin/teachers/${id}`, { method: "DELETE" })
}
export function clearTeacherPassword(id) {
  return apiFetch(`/admin/teachers/${id}/clear-password`, { method: "POST" })
}
