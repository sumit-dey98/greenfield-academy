// Admin schedule + periods CRUD (academic permission).
import { apiFetch } from "./client"

// GET /admin/schedule -> Page_ScheduleOut_
export function listSchedule(params) {
  return apiFetch("/admin/schedule", { query: params })
}
export function createSchedule(body) {
  return apiFetch("/admin/schedule", { method: "POST", body })
}
export function updateSchedule(id, body) {
  return apiFetch(`/admin/schedule/${id}`, { method: "PUT", body })
}
export function deleteSchedule(id) {
  return apiFetch(`/admin/schedule/${id}`, { method: "DELETE" })
}

// Periods
export function listPeriods() {
  return apiFetch("/admin/periods")
}
export function createPeriod(body) {
  return apiFetch("/admin/periods", { method: "POST", body })
}
export function updatePeriod(id, body) {
  return apiFetch(`/admin/periods/${id}`, { method: "PUT", body })
}
export function deletePeriod(id) {
  return apiFetch(`/admin/periods/${id}`, { method: "DELETE" })
}
