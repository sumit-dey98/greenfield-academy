// Pre-aggregated attendance/results counts (academic permission).
// Kept in sync server-side on every attendance mark / result write — always current,
// far cheaper than fetching full row sets just to count them client-side.
import { apiFetch } from "./client"

// GET /admin/counts -> Page_CountOut_ ({items, total, limit, offset})
// Filters: scope_type ("class"|"student"), scope_id, metric, period_type ("month"|"exam"|"current"),
// period_key ("2026-07" or an exam_id), subject_id, limit (default 200, max 2000), offset.
// Always pass at least one narrowing filter — an unfiltered call can span the whole table.
export function listCounts(params) {
  return apiFetch("/admin/counts", { query: params })
}
