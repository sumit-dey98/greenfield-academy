// Admin attendance (academic permission).
import { apiFetch } from "./client"

// GET /admin/attendance -> Page_AttendanceAdminOut_
export function listAttendance(params) {
  return apiFetch("/admin/attendance", { query: params })
}
// POST /admin/attendance -> array of AttendanceOut  (body: { date, records: [{student_id, status}] })
export function markAttendance(body) {
  return apiFetch("/admin/attendance", { method: "POST", body })
}
