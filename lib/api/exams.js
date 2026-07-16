// Admin exams CRUD (academic permission).
import { apiFetch } from "./client"

// GET /admin/exams -> array of ExamOut
export function listExams(params) {
  return apiFetch("/admin/exams", { query: params })
}
export function getExam(id) {
  return apiFetch(`/admin/exams/${id}`)
}
export function createExam(body) {
  return apiFetch("/admin/exams", { method: "POST", body })
}
export function updateExam(id, body) {
  return apiFetch(`/admin/exams/${id}`, { method: "PUT", body })
}
export function deleteExam(id) {
  return apiFetch(`/admin/exams/${id}`, { method: "DELETE" })
}
