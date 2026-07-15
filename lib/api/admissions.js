// Admin admissions management (admissions permission). See lib/api/admission.js for the
// separate cms-gated open/closed toggle.
import { apiFetch } from "./client"

// GET /admin/admissions -> Page_ApplicationAdminOut_
export function listApplications(params) {
  return apiFetch("/admin/admissions", { query: params })
}

// GET /admin/admissions/{id} -> ApplicationDetailOut
export function getApplication(id) {
  return apiFetch(`/admin/admissions/${id}`)
}

// PUT /admin/admissions/{id}/status -> ApplicationDetailOut
export function updateApplicationStatus(id, body) {
  return apiFetch(`/admin/admissions/${id}/status`, { method: "PUT", body })
}

// POST /admin/admissions/{id}/exam-schedule -> ExamScheduleOut
export function scheduleExam(id, body) {
  return apiFetch(`/admin/admissions/${id}/exam-schedule`, { method: "POST", body })
}

// POST /admin/admissions/bulk/exam-schedule -> ExamScheduleOut[]
export function bulkScheduleExam(body) {
  return apiFetch("/admin/admissions/bulk/exam-schedule", { method: "POST", body })
}

// POST /admin/admissions/{id}/grading-assignment -> GradingAssignmentOut
export function assignGrading(id, teacherId) {
  return apiFetch(`/admin/admissions/${id}/grading-assignment`, {
    method: "POST",
    body: { teacher_id: teacherId },
  })
}

// POST /admin/admissions/bulk/grading-assignment -> GradingAssignmentOut[]
export function bulkAssignGrading(applicationIds, teacherId) {
  return apiFetch("/admin/admissions/bulk/grading-assignment", {
    method: "POST",
    body: { application_ids: applicationIds, teacher_id: teacherId },
  })
}

// GET /admin/admissions/cycles/{cycleId}/merit-list -> MeritListOut { items, seats_available }
export function getMeritList(cycleId, params) {
  return apiFetch(`/admin/admissions/cycles/${cycleId}/merit-list`, { query: params })
}

// POST /admin/admissions/{id}/interview-schedule -> interview detail
export function scheduleInterview(id, body) {
  return apiFetch(`/admin/admissions/${id}/interview-schedule`, { method: "POST", body })
}

// POST /admin/admissions/{id}/interview-outcome -> ApplicationDetailOut
export function recordInterviewOutcome(id, body) {
  return apiFetch(`/admin/admissions/${id}/interview-outcome`, { method: "POST", body })
}

// POST /admin/admissions/bulk/status -> BulkStatusOut { updated, skipped }
export function bulkUpdateStatus(applicationIds, statusValue, decisionNotes) {
  return apiFetch("/admin/admissions/bulk/status", {
    method: "POST",
    body: { application_ids: applicationIds, status: statusValue, decision_notes: decisionNotes },
  })
}

// GET /admin/admissions/cycles -> Page_AdmissionCycleOut_ ({ items, total, limit, offset })
// Unwrapped to a plain array here since every caller just needs the full small list of
// cycles, not pagination controls (default limit is 20, which comfortably covers real usage).
export async function listCycles() {
  const page = await apiFetch("/admin/admissions/cycles", { query: { limit: 200 } })
  return page?.items ?? []
}

// POST /admin/admissions/cycles -> AdmissionCycleOut
export function createCycle(body) {
  return apiFetch("/admin/admissions/cycles", { method: "POST", body })
}

// PUT /admin/admissions/cycles/{id} -> AdmissionCycleOut
export function updateCycle(id, body) {
  return apiFetch(`/admin/admissions/cycles/${id}`, { method: "PUT", body })
}
