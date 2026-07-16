// Admin testimonials CRUD (cms permission).
import { apiFetch } from "./client"

// GET /admin/testimonials -> array of TestimonialOut (includes inactive)
export function listTestimonials(params) {
  return apiFetch("/admin/testimonials", { query: params })
}
export function getTestimonial(id) {
  return apiFetch(`/admin/testimonials/${id}`)
}
export function createTestimonial(body) {
  return apiFetch("/admin/testimonials", { method: "POST", body })
}
export function updateTestimonial(id, body) {
  return apiFetch(`/admin/testimonials/${id}`, { method: "PUT", body })
}
export function deleteTestimonial(id) {
  return apiFetch(`/admin/testimonials/${id}`, { method: "DELETE" })
}
