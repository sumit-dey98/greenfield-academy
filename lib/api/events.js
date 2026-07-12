// Admin events + event images CRUD (cms permission).
import { apiFetch } from "./client"

// GET /admin/events -> Page_EventOut_ (includes unpublished drafts)
export function listEvents(params) {
  return apiFetch("/admin/events", { query: params })
}
// GET /admin/events/{id} -> EventWithImagesOut
export function getEvent(id) {
  return apiFetch(`/admin/events/${id}`)
}
export function createEvent(body) {
  return apiFetch("/admin/events", { method: "POST", body })
}
export function updateEvent(id, body) {
  return apiFetch(`/admin/events/${id}`, { method: "PUT", body })
}
export function deleteEvent(id) {
  return apiFetch(`/admin/events/${id}`, { method: "DELETE" })
}

// Images
export function listEventImages(eventId) {
  return apiFetch(`/admin/events/${eventId}/images`)
}
export function addEventImage(eventId, body) {
  return apiFetch(`/admin/events/${eventId}/images`, { method: "POST", body })
}
export function updateEventImage(eventId, imageId, body) {
  return apiFetch(`/admin/events/${eventId}/images/${imageId}`, { method: "PUT", body })
}
export function deleteEventImage(eventId, imageId) {
  return apiFetch(`/admin/events/${eventId}/images/${imageId}`, { method: "DELETE" })
}
