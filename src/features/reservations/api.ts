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

/** Same body as a customer booking; the API creates it already confirmed, with source "admin". */
export type CreateReservationInput = {
  service_id: string
  start_at: string
  customer_name: string
  customer_phone: string
  artist_id?: string | undefined
  customer_note?: string | undefined
  reference_image_url?: string | undefined
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

const ALL_PAGE_SIZE = 100
/** A safety stop for a runaway range; far above what one studio books in a month. */
const ALL_MAX_PAGES = 10

/** Every reservation in the range, following the pagination. For calendars, which need them all. */
export async function listAllReservations(
  params: Omit<ListReservationsParams, 'page' | 'per_page'>,
): Promise<Booking[]> {
  const bookings: Booking[] = []
  for (let page = 1; page <= ALL_MAX_PAGES; page += 1) {
    const result = await listReservations({ ...params, page, per_page: ALL_PAGE_SIZE })
    bookings.push(...result.data)
    if (page >= result.meta.total_pages) break
  }
  return bookings
}

export async function createReservation(input: CreateReservationInput): Promise<Booking> {
  const res = await api.post<{ data: Booking }>('/admin/bookings', input)
  return res.data.data
}
