// Teacher self-service reads/writes (the logged-in teacher).
import { apiFetch } from "./client"

// GET /teachers/me/schedule -> array of TeacherScheduleEntryOut (class_name + subject_name joined)
export function getMySchedule(params) {
  return apiFetch("/teachers/me/schedule", { query: params })
}

// GET /teachers/me -> TeacherOut
export function getMe() {
  return apiFetch("/teachers/me")
}

// PUT /teachers/me -> TeacherOut (self-editable fields: phone, avatar, message, bio)
export function updateMe(body) {
  return apiFetch("/teachers/me", { method: "PUT", body })
}

// GET /teachers/me/class -> ClassRosterOut (homeroom only)
export function getMyClass(params) {
  return apiFetch("/teachers/me/class", { query: params })
}

// GET /teachers/me/classes/{classId}/students -> array of StudentOut (any taught class)
export function getTaughtClassStudents(classId, params) {
  return apiFetch(`/teachers/me/classes/${classId}/students`, { query: params })
}

// GET /teachers/me/exams -> array of ExamOut
export function getMyExams(params) {
  return apiFetch("/teachers/me/exams", { query: params })
}

// GET /teachers/me/results -> Page_TeacherResultOut_
export function getMyResults(params) {
  return apiFetch("/teachers/me/results", { query: params })
}

// POST /teachers/me/results -> array of ResultOut (bulk insert-or-update; grade computed server-side)
export function saveResults(body) {
  return apiFetch("/teachers/me/results", { method: "POST", body })
}

// GET /teachers/me/attendance -> Page_TeacherAttendanceOut_ (homeroom)
export function getMyAttendance(params) {
  return apiFetch("/teachers/me/attendance", { query: params })
}

// POST /teachers/me/attendance -> array of AttendanceOut (bulk; homeroom)
export function markAttendance(body) {
  return apiFetch("/teachers/me/attendance", { method: "POST", body })
}
