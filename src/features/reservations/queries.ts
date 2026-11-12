import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { availabilityKeys } from '@/lib/api/public-queries'

import { changeStatus, getReservation, listReservations, updateReservation } from './api'

import type { ChangeStatusInput, ListReservationsParams, UpdateReservationInput } from './api'

export const reservationKeys = {
  all: ['reservations'] as const,
  list: (params: ListReservationsParams) => [...reservationKeys.all, 'list', params] as const,
  detail: (id: string) => [...reservationKeys.all, 'detail', id] as const,
}

export const reservationListOptions = (params: ListReservationsParams) =>
  queryOptions({
    queryKey: reservationKeys.list(params),
    queryFn: () => listReservations(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

export const reservationDetailOptions = (id: string) =>
  queryOptions({
    queryKey: reservationKeys.detail(id),
    queryFn: () => getReservation(id),
    staleTime: 15_000,
  })

export function useReservationsQuery(params: ListReservationsParams) {
  return useQuery(reservationListOptions(params))
}

export function useReservationQuery(id: string | undefined) {
  return useQuery({
    ...reservationDetailOptions(id ?? ''),
    enabled: id !== undefined,
    // 404 means it is gone; retrying would only keep the panel spinning.
    retry: false,
  })
}

/** After any change the list and detail are stale, and so may be the free slots. */
function useRefreshAfterChange() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: reservationKeys.all })
    void queryClient.invalidateQueries({ queryKey: availabilityKeys.all })
  }
}

export function useChangeStatusMutation(id: string) {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: (input: ChangeStatusInput) => changeStatus(id, input),
    // On success and on 409 alike the data on screen is out of date.
    onSettled: refresh,
  })
}

export function useUpdateReservationMutation(id: string) {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: (input: UpdateReservationInput) => updateReservation(id, input),
    onSettled: refresh,
  })
}
