// Admin admission-open toggle (cms permission).
import { apiFetch } from "./client"

// GET /admin/admission-status -> AdmissionStatusOut
export function getAdmissionStatus() {
  return apiFetch("/admin/admission-status")
}
// PUT /admin/admission-status -> AdmissionStatusOut
export function setAdmissionStatus(value) {
  return apiFetch("/admin/admission-status", { method: "PUT", body: { value } })
}
