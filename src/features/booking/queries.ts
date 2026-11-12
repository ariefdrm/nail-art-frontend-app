import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toApiError } from '@/lib/api/errors'
import { availabilityKeys } from '@/lib/api/public-queries'

import { createBooking } from './api'

export function useCreateBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBooking,
    onError: (error) => {
      // The slot was taken or blocked: whatever we showed is out of date.
      if (toApiError(error).code === 'SLOT_UNAVAILABLE') {
        void queryClient.invalidateQueries({ queryKey: availabilityKeys.all })
      }
    },
  })
}
