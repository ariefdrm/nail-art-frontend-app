import { api } from '@/lib/api/client'

import type { Booking, BookingStatus, Paginated } from '@/lib/api/types'

export type ListReservationsParams = {
  date_from?: string | undefined
  date_to?: string | undefined
  status?: BookingStatus | undefined
  artist_id?: string | undefined
  q?: string | undefined
  page?: number | undefined
  per_page?: number | undefined
}

export type ChangeStatusInput = { status: BookingStatus; reason?: string | undefined }

/** Every field optional, at least one required by the API. An empty note string clears the note. */
export type UpdateReservationInput = {
  start_at?: string | undefined
  artist_id?: string | undefined
  service_id?: string | undefined
  customer_note?: string | undefined
  admin_note?: string | undefined
}

export async function listReservations(
  params: ListReservationsParams,
): Promise<Paginated<Booking>> {
  const res = await api.get<Paginated<Booking>>('/admin/bookings', { params })
  return res.data
}

export async function getReservation(id: string): Promise<Booking> {
  const res = await api.get<{ data: Booking }>(`/admin/bookings/${id}`)
  return res.data.data
}

export async function changeStatus(id: string, input: ChangeStatusInput): Promise<Booking> {
  const res = await api.patch<{ data: Booking }>(`/admin/bookings/${id}/status`, input)
  return res.data.data
}

export async function updateReservation(
  id: string,
  input: UpdateReservationInput,
): Promise<Booking> {
  const res = await api.patch<{ data: Booking }>(`/admin/bookings/${id}`, input)
  return res.data.data
}
