import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { getUnreadCount, listNotifications, markAllRead, markRead } from './api'

import type { ListNotificationsParams } from './api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: ListNotificationsParams) => [...notificationKeys.all, 'list', params] as const,
  unread: ['notifications', 'unread-count'] as const,
}

/** How often the bell asks. React Query pauses this while the tab is hidden. */
export const UNREAD_POLL_MS = 30_000

export function useUnreadCountQuery() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: getUnreadCount,
    refetchInterval: UNREAD_POLL_MS,
    refetchIntervalInBackground: false,
    // Coming back to the tab asks again straight away.
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  })
}

export function useNotificationsQuery(params: ListNotificationsParams) {
  return useQuery(
    queryOptions({
      queryKey: notificationKeys.list(params),
      queryFn: () => listNotifications(params),
      placeholderData: keepPreviousData,
      staleTime: 15_000,
    }),
  )
}

function useRefreshNotifications() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
}

export function useMarkReadMutation() {
  const refresh = useRefreshNotifications()
  return useMutation({ mutationFn: (id: string) => markRead(id), onSettled: refresh })
}

export function useMarkAllReadMutation() {
  const refresh = useRefreshNotifications()
  return useMutation({ mutationFn: markAllRead, onSettled: refresh })
}
