// Student self-service reads/writes (the logged-in student's own data).
import { apiFetch } from "./client"

// GET /students/me -> StudentOut
export function getMe() {
  return apiFetch("/students/me")
}

// PUT /students/me -> StudentOut (self-editable: phone, address, avatar, guardian, guardian_phone)
export function updateMe(body) {
  return apiFetch("/students/me", { method: "PUT", body })
}

// GET /students/me/class -> StudentClassOut (class + homeroom teacher)
export function getMyClass() {
  return apiFetch("/students/me/class")
}

// GET /students/me/results -> array of ResultOut
export function getMyResults(params) {
  return apiFetch("/students/me/results", { query: params })
}

// GET /students/me/attendance -> array of AttendanceOut
export function getMyAttendance(params) {
  return apiFetch("/students/me/attendance", { query: params })
}

// GET /students/me/schedule -> array of ScheduleEntryOut
export function getMySchedule(params) {
  return apiFetch("/students/me/schedule", { query: params })
}
