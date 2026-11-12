import { api } from '@/lib/api/client'

import type { Booking } from '@/lib/api/types'

export type CancelInput = { phone: string; reason?: string | undefined }

/** Code plus phone is the customer's only proof of ownership; a mismatch is a 404. */
export async function lookupBooking(code: string, phone: string): Promise<Booking> {
  const res = await api.get<{ data: Booking }>(`/bookings/${encodeURIComponent(code)}`, {
    params: { phone },
  })
  return res.data.data
}

export async function cancelBooking(code: string, input: CancelInput): Promise<Booking> {
  const res = await api.patch<{ data: Booking }>(
    `/bookings/${encodeURIComponent(code)}/cancel`,
    input,
  )
  return res.data.data
}
