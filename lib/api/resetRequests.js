// Password reset requests: public submission + admin queue.
import { apiFetch } from "./client"

// POST /auth/request-password-reset (public) — body { role, email }
export function requestPasswordReset(role, email) {
  return apiFetch("/auth/request-password-reset", {
    method: "POST",
    auth: false,
    body: { role, email: email.trim().toLowerCase() },
  })
}

// GET /admin/password-reset-requests -> Page_PasswordResetRequestOut_
export function listResetRequests(params) {
  return apiFetch("/admin/password-reset-requests", { query: params })
}

// POST /admin/password-reset-requests/{id}/accept -> PasswordResetRequestOut
export function acceptResetRequest(id) {
  return apiFetch(`/admin/password-reset-requests/${id}/accept`, { method: "POST" })
}
