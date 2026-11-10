import {
  clearSession,
  getAccessExpiresAt,
  getAccessToken,
  isAccessTokenFresh,
  setAccessTokenUntil,
} from './token-store'

/**
 * Tabs share one refresh cookie that JavaScript cannot inspect, so they coordinate by sharing the
 * new access token (docs/API_GUIDE.md section 4.3). Nothing here is persisted.
 */
type AuthMessage =
  | { type: 'token'; access_token: string; expires_at: number }
  | { type: 'need-token' }
  | { type: 'logout' }

const CHANNEL_NAME = 'np-auth'

const channel: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null

function isAuthMessage(value: unknown): value is AuthMessage {
  return typeof value === 'object' && value !== null && 'type' in value
}

function post(message: AuthMessage): void {
  channel?.postMessage(message)
}

channel?.addEventListener('message', (event: MessageEvent<unknown>) => {
  const message = event.data
  if (!isAuthMessage(message)) return
  switch (message.type) {
    case 'token':
      setAccessTokenUntil(message.access_token, message.expires_at)
      break
    case 'need-token': {
      const token = getAccessToken()
      if (token && isAccessTokenFresh()) {
        post({ type: 'token', access_token: token, expires_at: getAccessExpiresAt() })
      }
      break
    }
    case 'logout':
      // Do not echo it back: every tab already got the same message.
      clearSession()
      break
  }
})

export function broadcastToken(accessToken: string, expiresAt: number): void {
  post({ type: 'token', access_token: accessToken, expires_at: expiresAt })
}

export function broadcastLogout(): void {
  post({ type: 'logout' })
}

/** Asks the other tabs for a fresh access token. Resolves null when nobody answers in time. */
export function askOtherTabsForToken(timeoutMs: number): Promise<string | null> {
  const current = channel
  if (!current) return Promise.resolve(null)

  return new Promise((resolve) => {
    function finish(token: string | null): void {
      clearTimeout(timer)
      current?.removeEventListener('message', onMessage)
      resolve(token)
    }
    function onMessage(event: MessageEvent<unknown>): void {
      const message = event.data
      if (isAuthMessage(message) && message.type === 'token' && message.expires_at > Date.now()) {
        // The listener above already stored it in memory; resolve once it has.
        finish(message.access_token)
      }
    }
    const timer = setTimeout(() => finish(null), timeoutMs)
    current.addEventListener('message', onMessage)
    post({ type: 'need-token' })
  })
}
