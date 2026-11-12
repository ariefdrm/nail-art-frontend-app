import { postLogout } from '@/lib/api/auth-endpoints'

import { broadcastLogout } from './channel'
import { SessionExpiredError, refreshAccessToken } from './refresh'
import {
  clearSession,
  getAccessToken,
  hasSessionHint,
  isAccessTokenFresh,
  setAccessToken,
  setSessionHint,
} from './token-store'

import type { AccessGrant } from '@/lib/api/auth-endpoints'

/** After POST /auth/login: keep the access token in memory and remember that this browser signed in. */
export function startSession(grant: AccessGrant): void {
  setAccessToken(grant.access_token, grant.expires_in)
  setSessionHint()
}

/**
 * Answers "am I signed in?" on first load of an admin page in this tab. The cookie is invisible to
 * JavaScript, so it asks the backend: 200 = signed in, 401 = not signed in (an expected outcome).
 * Other failures (403 origin, network, 429) propagate so the UI can explain them.
 */
export async function bootstrapSession(): Promise<boolean> {
  if (isAccessTokenFresh() && getAccessToken()) return true
  if (!hasSessionHint()) return false
  try {
    await refreshAccessToken()
    return true
  } catch (error) {
    if (error instanceof SessionExpiredError) return false
    throw error
  }
}

/** Forgets the session in this tab and tells the others, without calling the backend. */
export function endLocalSession(): void {
  clearSession()
  broadcastLogout()
}

/** Ends this browser's session: backend clears the cookie, then every tab forgets its token. */
export async function logout(): Promise<void> {
  try {
    await postLogout()
  } finally {
    clearSession()
    broadcastLogout()
  }
}

type SessionExpiredListener = () => void
const expiredListeners = new Set<SessionExpiredListener>()

/** The login screen / guard subscribes to show "Sesi berakhir, silakan masuk lagi." */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  expiredListeners.add(listener)
  return () => {
    expiredListeners.delete(listener)
  }
}

export function emitSessionExpired(): void {
  // Listeners first, so they can tell "expired" from a voluntary logout when the session clears.
  expiredListeners.forEach((listener) => listener())
  clearSession()
  broadcastLogout()
}
