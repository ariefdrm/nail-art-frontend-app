import { useMutation } from '@tanstack/react-query'

import { cancelBooking, lookupBooking } from './api'

import type { CancelInput } from './api'

// Both are mutations on purpose: a query would put the booking code and phone number into a cache
// key that lives for the whole session (PRD section 9, privacy).

export function useLookupBookingMutation() {
  return useMutation({
    mutationFn: (input: { code: string; phone: string }) => lookupBooking(input.code, input.phone),
  })
}

export function useCancelBookingMutation() {
  return useMutation({
    mutationFn: (input: CancelInput & { code: string }) =>
      cancelBooking(input.code, { phone: input.phone, reason: input.reason }),
  })
}
