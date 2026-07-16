// Auth calls against the FastAPI backend.
import { apiFetch } from "./client"
import { setTokens, clearTokens } from "./tokens"

/**
 * POST /auth/login — one endpoint resolves students -> teachers -> admin users.
 * Stores the returned token pair and returns the Token payload
 * { access_token, refresh_token, token_type, user_type, role }.
 */
export async function login(email, password) {
  const token = await apiFetch("/auth/login", {
    method: "POST",
    auth: false,
    body: { email: email.trim().toLowerCase(), password },
  })
  setTokens({ accessToken: token.access_token, refreshToken: token.refresh_token })
  return token
}

/**
 * POST /auth/set-password — self-service first-time password set for an account with no
 * password yet (never set, or cleared by an admin). Stores tokens and returns the Token
 * (auto-login). Throws PASSWORD_ALREADY_SET (409) if the account already has a password.
 */
export async function setPassword(email, newPassword) {
  const token = await apiFetch("/auth/set-password", {
    method: "POST",
    auth: false,
    body: { email: email.trim().toLowerCase(), new_password: newPassword },
  })
  setTokens({ accessToken: token.access_token, refreshToken: token.refresh_token })
  return token
}

// GET /auth/me — { id, user_type, role } for the current access token.
export function getMe() {
  return apiFetch("/auth/me")
}

/**
 * Fetch the display profile for the logged-in account so the UI can show
 * name/roll/subject/etc. The login/me responses only carry identity.
 * Best-effort: admin roles without `users` read permission (editor, mock_*)
 * simply get an empty object.
 */
export async function fetchProfile(userType, id) {
  try {
    if (userType === "student") return await apiFetch("/students/me")
    if (userType === "teacher") return await apiFetch("/teachers/me")
    if (userType === "admin" && id) return await apiFetch(`/admin/users/${id}`)
  } catch {
    // Profile enrichment is optional; identity still comes from /auth/me.
  }
  return {}
}

export function logout() {
  // No server-side token revocation exists; clearing the client tokens is the logout.
  clearTokens()
}
