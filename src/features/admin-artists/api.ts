import { api } from '@/lib/api/client'
import { todayWib } from '@/lib/format'

import type { Artist, ArtistInput, Paginated, Booking } from '@/lib/api/types'

export async function listAdminArtists(): Promise<Artist[]> {
  const res = await api.get<{ data: Artist[] }>('/admin/artists')
  return res.data.data
}

export async function createArtist(input: ArtistInput): Promise<Artist> {
  const res = await api.post<{ data: Artist }>('/admin/artists', input)
  return res.data.data
}

/** PUT replaces the whole artist: send every field. */
export async function updateArtist(id: string, input: ArtistInput): Promise<Artist> {
  const res = await api.put<{ data: Artist }>(`/admin/artists/${id}`, input)
  return res.data.data
}

/** The API turns this into "deactivate": the artist stays so past bookings keep their name. */
export async function deactivateArtist(id: string): Promise<void> {
  await api.delete(`/admin/artists/${id}`)
}

/** Reservations from today on that still need the artist: waiting for confirmation, or confirmed. */
export async function countUpcomingBookings(artistId: string): Promise<number> {
  const counts = await Promise.all(
    (['pending', 'confirmed'] as const).map(async (status) => {
      const res = await api.get<Paginated<Booking>>('/admin/bookings', {
        params: { artist_id: artistId, status, date_from: todayWib(), per_page: 1 },
      })
      return res.data.meta.total
    }),
  )
  return counts.reduce((sum, count) => sum + count, 0)
}
