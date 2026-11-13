import { vi } from 'vitest'

type Options = {
  permission?: NotificationPermission
  /** What the permission prompt answers when asked. */
  promptResult?: NotificationPermission
  subscribed?: boolean
  secure?: boolean
  /** Leave the Push API out, like a browser without it. */
  unsupported?: boolean
}

const ENDPOINT = 'https://push.test/abc'

/** Replaces the browser's push APIs with spies, which happy-dom does not provide. */
export function installFakePush(options: Options = {}) {
  const {
    permission = 'default',
    promptResult = 'granted',
    secure = true,
    unsupported = false,
  } = options
  const win = window as unknown as Record<string, unknown>
  const nav = navigator as unknown as Record<string, unknown>
  const saved = {
    PushManager: win.PushManager,
    Notification: win.Notification,
    isSecureContext: win.isSecureContext,
    serviceWorker: nav.serviceWorker,
  }

  const subscription = {
    endpoint: ENDPOINT,
    toJSON: () => ({ endpoint: ENDPOINT, keys: { p256dh: 'p256dh-key', auth: 'auth-secret' } }),
    unsubscribe: vi.fn(() => Promise.resolve(true)),
  }
  let current: typeof subscription | null = options.subscribed ? subscription : null
  const subscribe = vi.fn(() => {
    current = subscription
    return Promise.resolve(subscription)
  })
  subscription.unsubscribe.mockImplementation(() => {
    current = null
    return Promise.resolve(true)
  })
  const registration = {
    pushManager: { subscribe, getSubscription: vi.fn(() => Promise.resolve(current)) },
  }
  // Like a real browser: once the worker has been registered it can be found again.
  let registered = options.subscribed === true
  const register = vi.fn(() => {
    registered = true
    return Promise.resolve(registration)
  })
  const requestPermission = vi.fn(() => Promise.resolve(promptResult))

  Object.defineProperty(window, 'isSecureContext', { value: secure, configurable: true })
  if (unsupported) {
    delete win.PushManager
  } else {
    win.PushManager = class {}
    win.Notification = { permission, requestPermission }
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register,
        ready: Promise.resolve(registration),
        getRegistration: vi.fn(() => Promise.resolve(registered ? registration : undefined)),
      },
    })
  }

  return {
    subscribe,
    register,
    requestPermission,
    subscription,
    restore() {
      win.PushManager = saved.PushManager
      win.Notification = saved.Notification
      Object.defineProperty(window, 'isSecureContext', {
        value: saved.isSecureContext,
        configurable: true,
      })
      Object.defineProperty(navigator, 'serviceWorker', {
        value: saved.serviceWorker,
        configurable: true,
      })
    },
  }
}
