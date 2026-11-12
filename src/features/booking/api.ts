import { api } from '@/lib/api/client'

import type { Booking, BookingStatus } from '@/lib/api/types'

import './history-state'

export type CreateBookingInput = {
  service_id: string
  start_at: string
  customer_name: string
  customer_phone: string
  artist_id?: string | undefined
  customer_note?: string | undefined
  reference_image_url?: string | undefined
}

/** The part of a created booking the success page shows. */
export type BookingConfirmation = {
  booking_code: string
  status: BookingStatus
  service_name: string
  artist_name: string
  start_at: string
  end_at: string
  total_price: number
}

export async function createBooking(input: CreateBookingInput): Promise<BookingConfirmation> {
  const res = await api.post<{ data: Booking }>('/bookings', input)
  const booking = res.data.data
  return {
    booking_code: booking.booking_code,
    status: booking.status,
    service_name: booking.service.name,
    artist_name: booking.artist.name,
    start_at: booking.start_at,
    end_at: booking.end_at,
    total_price: booking.total_price,
  }
}
