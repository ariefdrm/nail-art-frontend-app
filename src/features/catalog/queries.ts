import { queryOptions, useQuery } from '@tanstack/react-query'

import { getService, listServices } from './api'

export const serviceKeys = {
  all: ['services'] as const,
  list: (category?: string) => [...serviceKeys.all, 'list', category ?? 'all'] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
}

// The catalog changes rarely: keep it fresh for five minutes.
const CATALOG_STALE_MS = 300_000

export const serviceListOptions = (category?: string) =>
  queryOptions({
    queryKey: serviceKeys.list(category),
    queryFn: () => listServices(category),
    staleTime: CATALOG_STALE_MS,
  })

export const serviceDetailOptions = (id: string) =>
  queryOptions({
    queryKey: serviceKeys.detail(id),
    queryFn: () => getService(id),
    staleTime: CATALOG_STALE_MS,
  })

export function useServicesQuery(category?: string) {
  return useQuery(serviceListOptions(category))
}

export function useServiceQuery(id: string | undefined) {
  return useQuery({
    ...serviceDetailOptions(id ?? ''),
    enabled: id !== undefined,
    // A missing service is an answer, not a glitch.
    retry: false,
  })
}
