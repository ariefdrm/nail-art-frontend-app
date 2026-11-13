import { api } from '@/lib/api/client'

import type { Notification, Paginated } from '@/lib/api/types'

export type ListNotificationsParams = {
  unread?: boolean | undefined
  page?: number | undefined
  per_page?: number | undefined
}

export async function listNotifications(
  params: ListNotificationsParams,
): Promise<Paginated<Notification>> {
  const res = await api.get<Paginated<Notification>>('/admin/notifications', { params })
  return res.data
}

/** Light enough to poll. */
export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ data: { unread: number } }>('/admin/notifications/unread-count')
  return res.data.data.unread
}

/** Idempotent; reading does not change what other admins have read. */
export async function markRead(id: string): Promise<void> {
  await api.patch(`/admin/notifications/${id}/read`)
}

export async function markAllRead(): Promise<number> {
  const res = await api.post<{ data: { marked: number } }>('/admin/notifications/read-all')
  return res.data.data.marked
}
