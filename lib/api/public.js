// Public, no-auth endpoints (what the public website / logged-in portals can freely read).
import { apiFetch, ApiError } from "./client"
import { API_BASE } from "./config"

// GET /notices -> Page_NoticeOut_ ({ items, total, limit, offset })
export function getNotices(params) {
  return apiFetch("/notices", { auth: false, query: params })
}

// GET /events -> Page_EventOut_
export function getEvents(params) {
  return apiFetch("/events", { auth: false, query: params })
}

// GET /events/featured -> array of EventOut (published + featured only, capped at 6, not
// paginated — used for the homepage/latest-events carousel).
export function getFeaturedEvents() {
  return apiFetch("/events/featured", { auth: false })
}

// GET /events/{slug} -> EventWithImagesOut
export function getEvent(slug) {
  return apiFetch(`/events/${slug}`, { auth: false })
}

// GET /testimonials -> array of TestimonialOut
export function getTestimonials(params) {
  return apiFetch("/testimonials", { auth: false, query: params })
}

// GET /admission-status -> AdmissionStatusOut
export function getAdmissionStatus() {
  return apiFetch("/admission-status", { auth: false })
}

// GET /faculty -> array of FacultyOut
// Optional { role, subject } filters, e.g. { role: "Principal" } for an exact match.
export function getFaculty(params) {
  return apiFetch("/faculty", { auth: false, query: params })
}

// GET /classes -> array of ClassPublicOut ({ id, name, grade, section })
export function getPublicClasses() {
  return apiFetch("/classes", { auth: false })
}

// POST /admissions/apply (multipart/form-data) -> ApplicationSubmitOut
// `formData` must be a FormData instance (text fields + optional `documents` files).
export function submitApplication(formData) {
  return apiFetch("/admissions/apply", { method: "POST", body: formData, auth: false })
}

// POST /admissions/{referenceNumber}/verify -> ApplicationVerifyOut { access_token, expires_in }
export function verifyApplicationAccess(referenceNumber, contactValue) {
  return apiFetch(`/admissions/${referenceNumber}/verify`, {
    method: "POST",
    body: { contact_value: contactValue },
    auth: false,
  })
}

// GET /admissions/{referenceNumber}/status (requires X-Admission-Token) -> ApplicationTrackOut
export function getApplicationStatus(referenceNumber, accessToken) {
  return apiFetch(`/admissions/${referenceNumber}/status`, {
    auth: false,
    headers: { "X-Admission-Token": accessToken },
  })
}

// GET /admissions/{referenceNumber}/admit-card (requires X-Admission-Token) -> PDF blob.
// Not JSON, so this bypasses apiFetch and does a raw fetch instead.
export async function getAdmitCardBlob(referenceNumber, accessToken) {
  const res = await fetch(`${API_BASE}/admissions/${referenceNumber}/admit-card`, {
    headers: { "X-Admission-Token": accessToken },
  })
  if (!res.ok) {
    let data = null
    try { data = await res.json() } catch { /* non-JSON error body */ }
    throw new ApiError({
      status: res.status,
      error_code: data?.error_code,
      message: data?.message || "Could not download the admit card.",
    })
  }
  return res.blob()
}

// GET /admissions/{referenceNumber}/acceptance-letter (requires X-Admission-Token) -> PDF blob.
// Only available once status === "accepted" and the cycle's results are published.
export async function getAcceptanceLetterBlob(referenceNumber, accessToken) {
  const res = await fetch(`${API_BASE}/admissions/${referenceNumber}/acceptance-letter`, {
    headers: { "X-Admission-Token": accessToken },
  })
  if (!res.ok) {
    let data = null
    try { data = await res.json() } catch { /* non-JSON error body */ }
    throw new ApiError({
      status: res.status,
      error_code: data?.error_code,
      message: data?.message || "Could not download the acceptance letter.",
    })
  }
  return res.blob()
}
