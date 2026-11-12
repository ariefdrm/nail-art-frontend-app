import { queryOptions, useQuery } from '@tanstack/react-query'

import { getAvailability, getService, listArtists, listServices } from './public-data'

import type { AvailabilityParams } from './public-data'

export const serviceKeys = {
  all: ['services'] as const,
  list: () => [...serviceKeys.all, 'list'] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
}

export const availabilityKeys = {
  all: ['availability'] as const,
  slots: (params: AvailabilityParams) => [...availabilityKeys.all, params] as const,
}

export const artistKeys = { all: ['artists'] as const }

// The catalog changes rarely: keep it fresh for five minutes.
const CATALOG_STALE_MS = 300_000

export const serviceListOptions = () =>
  queryOptions({
    queryKey: serviceKeys.list(),
    queryFn: listServices,
    staleTime: CATALOG_STALE_MS,
  })

export const serviceDetailOptions = (id: string) =>
  queryOptions({
    queryKey: serviceKeys.detail(id),
    queryFn: () => getService(id),
    staleTime: CATALOG_STALE_MS,
  })

export const availabilityOptions = (params: AvailabilityParams) =>
  queryOptions({
    queryKey: availabilityKeys.slots(params),
    queryFn: () => getAvailability(params),
    // Slots go stale quickly: someone else may take one while a person thinks.
    staleTime: 15_000,
  })

export function useServicesQuery() {
  return useQuery(serviceListOptions())
}

export function useServiceQuery(id: string | undefined) {
  return useQuery({
    ...serviceDetailOptions(id ?? ''),
    enabled: id !== undefined,
    // A missing service is an answer, not a glitch.
    retry: false,
  })
}

export function useArtistsQuery(enabled = true) {
  return useQuery({
    queryKey: artistKeys.all,
    queryFn: listArtists,
    staleTime: CATALOG_STALE_MS,
    enabled,
  })
}

export function useAvailabilityQuery(params: AvailabilityParams | undefined) {
  return useQuery({
    ...availabilityOptions(params ?? { service_id: '', date: '' }),
    enabled: params !== undefined,
  })
}
