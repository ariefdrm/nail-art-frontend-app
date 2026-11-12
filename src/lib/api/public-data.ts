import { api } from './client'

import type { Artist, Availability, Service } from './types'

/**
 * Public read-only data (services, artists, free slots). Several features need it: the catalog,
 * the booking wizard and the admin reservation tools, so it lives here instead of in one of them.
 */

export type AvailableSlot = { start_at: string; end_at: string; available_artist_ids: string[] }

export type AvailabilityParams = {
  service_id: string
  date: string
  artist_id?: string | undefined
}

export async function listServices(): Promise<Service[]> {
  const res = await api.get<{ data: Service[] }>('/services')
  return res.data.data
}

export async function getService(id: string): Promise<Service> {
  const res = await api.get<{ data: Service }>(`/services/${id}`)
  return res.data.data
}

export async function listArtists(): Promise<Artist[]> {
  const res = await api.get<{ data: Artist[] }>('/artists')
  return res.data.data
}

export async function getAvailability(params: AvailabilityParams): Promise<AvailableSlot[]> {
  const res = await api.get<{ data: Availability }>('/availability', { params })
  return res.data.data.slots.flatMap((slot) =>
    slot.start_at && slot.end_at
      ? [
          {
            start_at: slot.start_at,
            end_at: slot.end_at,
            available_artist_ids: slot.available_artist_ids ?? [],
          },
        ]
      : [],
  )
}
