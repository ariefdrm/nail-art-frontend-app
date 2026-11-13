import { urlBase64ToUint8Array } from '@/lib/push/vapid'

import type { PushSubscriptionBody } from './api'

/** The person said no (or had already blocked notifications for this site). */
export class PushPermissionError extends Error {
  readonly permission: NotificationPermission

  constructor(permission: NotificationPermission) {
    super(`Notification permission is ${permission}`)
    this.name = 'PushPermissionError'
    this.permission = permission
  }
}

const WORKER_URL = '/sw.js'

async function currentRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  return navigator.serviceWorker.getRegistration(WORKER_URL)
}

/** Whether this browser already holds a push subscription from an earlier "Aktifkan". */
export async function hasDeviceSubscription(): Promise<boolean> {
  const registration = await currentRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  return subscription !== null && subscription !== undefined
}

/**
 * Registers the worker, asks for permission, subscribes. Call it straight from a click: browsers
 * only show the permission prompt in response to a user gesture.
 */
export async function subscribeDevice(publicKey: string): Promise<PushSubscriptionBody> {
  const registration = await navigator.serviceWorker.register(WORKER_URL)
  await navigator.serviceWorker.ready

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PushPermissionError(permission)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  const { endpoint, keys } = subscription.toJSON()
  if (!endpoint || !keys?.p256dh || !keys.auth) {
    await subscription.unsubscribe()
    throw new Error('Browser returned an incomplete push subscription')
  }
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

/** Drops this browser's subscription. Returns its endpoint so the server can forget it too. */
export async function unsubscribeDevice(): Promise<string | null> {
  const registration = await currentRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return null
  const { endpoint } = subscription
  await subscription.unsubscribe()
  return endpoint
}
