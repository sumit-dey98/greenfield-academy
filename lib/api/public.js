// Public, no-auth endpoints (what the public website / logged-in portals can freely read).
import { apiFetch } from "./client"

// GET /notices -> Page_NoticeOut_ ({ items, total, limit, offset })
export function getNotices(params) {
  return apiFetch("/notices", { auth: false, query: params })
}

// GET /events -> Page_EventOut_
export function getEvents(params) {
  return apiFetch("/events", { auth: false, query: params })
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
export function getFaculty() {
  return apiFetch("/faculty", { auth: false })
}
