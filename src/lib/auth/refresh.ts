import { postRefresh } from '@/lib/api/auth-endpoints'
import { ApiError } from '@/lib/api/errors'

import { askOtherTabsForToken, broadcastToken } from './channel'
import {
  clearSession,
  getAccessToken,
  isAccessTokenFresh,
  setAccessToken,
  getAccessExpiresAt,
  setSessionHint,
} from './token-store'

export const REFRESH_LOCK = 'np-refresh'

/** How long a tab waits for another tab to hand over a fresh access token before using the cookie. */
const TAB_WAIT_MS = 200

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'SessionExpiredError'
  }
}

let inFlight: Promise<string> | null = null

async function rotate(rejected: string | null): Promise<string> {
  // 1. Another tab may have refreshed while we waited for the lock.
  const existing = getAccessToken()
  if (existing && existing !== rejected && isAccessTokenFresh()) return existing

  // 2. Ask the other tabs: the cookie was probably rotated by one of them already.
  const fromTabs = await askOtherTabsForToken(TAB_WAIT_MS)
  if (fromTabs && fromTabs !== rejected) return fromTabs

  // 3. Nobody has one: use the cookie.
  try {
    const grant = await postRefresh()
    setAccessToken(grant.access_token, grant.expires_in)
    setSessionHint()
    broadcastToken(grant.access_token, getAccessExpiresAt())
    return grant.access_token
  } catch (error) {
    // 401: the cookie is missing, expired or revoked. Anything else (403 origin, 429, 5xx, network)
    // keeps the session so the caller can report it or try again.
    if (error instanceof ApiError && error.status === 401) {
      clearSession()
      throw new SessionExpiredError()
    }
    throw error
  }
}

/**
 * Single-flight across callers in this tab (one shared promise) and across tabs (Web Locks).
 * Pass the token that was just rejected so a stale-but-unexpired one is not handed back.
 * See docs/API_GUIDE.md section 4.3.
 */
export function refreshAccessToken(options?: { rejected?: string | null }): Promise<string> {
  const rejected = options?.rejected ?? null
  // Older browsers (and test DOMs) have no Web Locks: fall back to the in-tab promise only.
  const locks = Reflect.get(navigator, 'locks') as LockManager | undefined
  inFlight ??= (
    locks ? locks.request(REFRESH_LOCK, () => rotate(rejected)) : rotate(rejected)
  ).finally(() => {
    inFlight = null
  })
  return inFlight
}
