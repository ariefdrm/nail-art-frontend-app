import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toApiError } from '@/lib/api/errors'

import { createBooking, getAvailability, listArtists } from './api'

import type { AvailabilityParams } from './api'

export const bookingKeys = {
  availability: ['availability'] as const,
  slots: (params: AvailabilityParams) => [...bookingKeys.availability, params] as const,
  artists: ['artists'] as const,
}

export const availabilityOptions = (params: AvailabilityParams) =>
  queryOptions({
    queryKey: bookingKeys.slots(params),
    queryFn: () => getAvailability(params),
    // Slots go stale quickly: someone else may take one while the customer thinks.
    staleTime: 15_000,
  })

export function useAvailabilityQuery(params: AvailabilityParams | undefined) {
  return useQuery({
    ...availabilityOptions(params ?? { service_id: '', date: '' }),
    enabled: params !== undefined,
  })
}

export function useArtistsQuery(enabled: boolean) {
  return useQuery({
    queryKey: bookingKeys.artists,
    queryFn: listArtists,
    staleTime: 300_000,
    enabled,
  })
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBooking,
    onError: (error) => {
      // The slot was taken or blocked: whatever we showed is out of date.
      if (toApiError(error).code === 'SLOT_UNAVAILABLE') {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.availability })
      }
    },
  })
}
