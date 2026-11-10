/**
 * The access token lives in memory only. The refresh token is the backend's HttpOnly cookie:
 * this app never sees it and must never store it (docs/API_GUIDE.md section 4.2).
 */

/** Non-secret hint ("this browser has signed in before"); lets first-time visitors skip a refresh call. */
export const SESSION_HINT_KEY = 'np.session'

/** Treat the access token as stale a bit before it really expires. */
const EXPIRY_MARGIN_MS = 10_000

let accessToken: string | null = null
let accessExpiresAt = 0
const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

export function getAccessToken(): string | null {
  return accessToken
}

export function isAccessTokenFresh(): boolean {
  return accessToken !== null && Date.now() < accessExpiresAt - EXPIRY_MARGIN_MS
}

/** Absolute expiry (ms since epoch); what tabs exchange over the BroadcastChannel. */
export function getAccessExpiresAt(): number {
  return accessExpiresAt
}

export function setAccessTokenUntil(token: string, expiresAt: number): void {
  accessToken = token
  accessExpiresAt = expiresAt
  notify()
}

export function setAccessToken(token: string, expiresInSeconds: number): void {
  setAccessTokenUntil(token, Date.now() + expiresInSeconds * 1000)
}

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    // Storage blocked: assume a session may exist and let the refresh call decide.
    return true
  }
}

export function setSessionHint(): void {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1')
  } catch {
    // Only an optimization; nothing to do.
  }
}

/** Forgets the in-memory token and the hint. The cookie is cleared by the backend on logout. */
export function clearSession(): void {
  accessToken = null
  accessExpiresAt = 0
  try {
    localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    // Storage unavailable: the in-memory state is already cleared.
  }
  notify()
}

/** Subscribe to session changes (compatible with useSyncExternalStore). */
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
