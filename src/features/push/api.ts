import { api } from '@/lib/api/client'

/** What the API stores of a browser subscription: the push service address and its two keys. */
export type PushSubscriptionBody = { endpoint: string; keys: { p256dh: string; auth: string } }

/** 404 means the server has Web Push switched off. */
export async function getPublicKey(): Promise<string> {
  const res = await api.get<{ data: { public_key: string } }>('/admin/push/public-key')
  return res.data.data.public_key
}

export async function registerSubscription(body: PushSubscriptionBody): Promise<void> {
  await api.post('/admin/push-subscriptions', body)
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await api.delete('/admin/push-subscriptions', { data: { endpoint } })
}
