export type PushSupport = { supported: true } | { supported: false; reason: 'insecure' | 'browser' }

/**
 * Web Push needs a service worker, the Push API and notifications, all of which exist only on
 * HTTPS or localhost. Safari on iOS also needs the site added to the home screen (PRD section 9).
 */
export function getPushSupport(): PushSupport {
  if (typeof window === 'undefined') return { supported: false, reason: 'browser' }
  if (!window.isSecureContext) return { supported: false, reason: 'insecure' }
  const hasApis =
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  return hasApis ? { supported: true } : { supported: false, reason: 'browser' }
}
