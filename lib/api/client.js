// Central fetch wrapper for the FastAPI backend.
// - attaches the Bearer access token
// - normalizes errors around the stable `error_code` (see API_GUIDE.md §2)
// - transparently refreshes the token pair on TOKEN_EXPIRED and retries once
// - signals unrecoverable auth failures via a `gfa:auth-expired` window event
//   (AuthContext listens and drops the session -> route guards redirect to login)

import { API_BASE } from "./config"
import { getTokens, setTokens, clearTokens } from "./tokens"

export class ApiError extends Error {
  constructor({ status, error_code, message, errors }) {
    super(message || error_code || "Request failed")
    this.name = "ApiError"
    this.status = status
    this.error_code = error_code
    this.errors = errors // field-level details on 422
  }
}

// Single-flight refresh: concurrent 401s share one /auth/refresh call.
let refreshPromise = null

async function performRefresh() {
  const { refreshToken } = getTokens()
  if (!refreshToken) throw new ApiError({ status: 401, error_code: "INVALID_TOKEN", message: "No refresh token" })

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) {
    clearTokens()
    throw new ApiError({ status: res.status, error_code: "INVALID_TOKEN", message: "Session expired" })
  }
  const data = await res.json()
  setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
  return data.access_token
}

function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

function emitAuthExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gfa:auth-expired"))
  }
}

/**
 * Call the backend. Returns parsed JSON (or null for 204).
 * @param {string} path e.g. "/auth/login" or "/students/me"
 * @param {object} opts { method, body, auth, headers, query }
 */
export async function apiFetch(path, { method = "GET", body, auth = true, headers = {}, query, _retry = false } = {}) {
  const { accessToken } = getTokens()

  const finalHeaders = { ...headers }
  let payload = body
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json"
    payload = JSON.stringify(body)
  }
  if (auth && accessToken) finalHeaders["Authorization"] = `Bearer ${accessToken}`

  const qs = query ? buildQuery(query) : ""
  const res = await fetch(`${API_BASE}${path}${qs}`, { method, headers: finalHeaders, body: payload })

  if (res.status === 204) return null

  let data = null
  const text = await res.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }

  if (res.ok) return data

  const code = typeof data === "object" && data ? data.error_code : undefined
  const message = typeof data === "object" && data ? data.message : undefined
  const errors = typeof data === "object" && data ? data.errors : undefined

  // Access token expired -> refresh once and retry the original request.
  if (res.status === 401 && code === "TOKEN_EXPIRED" && auth && !_retry) {
    try {
      await refreshTokens()
      return apiFetch(path, { method, body, auth, headers, query, _retry: true })
    } catch {
      emitAuthExpired()
      throw new ApiError({ status: 401, error_code: "INVALID_TOKEN", message: "Session expired" })
    }
  }

  // Unrecoverable auth failure -> drop the session.
  const badToken = res.status === 401 && code !== "INVALID_CREDENTIALS"
  const wrongAccountType = res.status === 403 && code === "FORBIDDEN_ACCOUNT_TYPE"
  if (auth && (badToken || wrongAccountType)) {
    clearTokens()
    emitAuthExpired()
  }

  throw new ApiError({ status: res.status, error_code: code, message, errors })
}

function buildQuery(params) {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    usp.append(k, v)
  }
  const s = usp.toString()
  return s ? `?${s}` : ""
}
