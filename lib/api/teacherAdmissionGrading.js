// Teacher self-service: blind entrance-exam grading (teacher account, own assignments only).
import { apiFetch } from "./client"

// GET /teachers/me/admission-grading -> Page_ApplicationGradingOut_ (blind fields only)
export function listMyGradingAssignments(params) {
  return apiFetch("/teachers/me/admission-grading", { query: params })
}

// POST /teachers/me/admission-grading/{applicationId}/result -> ApplicationGradingOut
export function submitGradingResult(applicationId, body) {
  return apiFetch(`/teachers/me/admission-grading/${applicationId}/result`, { method: "POST", body })
}
