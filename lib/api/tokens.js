// Access/refresh JWT storage. localStorage keeps the app fully client-side (no SSR auth),
// matching how this frontend already worked.

const ACCESS_KEY = "gfa_access_token"
const REFRESH_KEY = "gfa_refresh_token"

export function getTokens() {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null }
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  }
}

export function setTokens({ accessToken, refreshToken }) {
  if (typeof window === "undefined") return
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function hasTokens() {
  return !!getTokens().accessToken
}
