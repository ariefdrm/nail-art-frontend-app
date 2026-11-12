import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { artistKeys } from '@/lib/api/public-queries'

import {
  countUpcomingBookings,
  createArtist,
  deactivateArtist,
  listAdminArtists,
  updateArtist,
} from './api'

import type { ArtistInput } from '@/lib/api/types'

export const adminArtistKeys = {
  all: ['admin', 'artists'] as const,
  upcoming: (id: string) => [...adminArtistKeys.all, 'upcoming', id] as const,
}

export function useAdminArtistsQuery() {
  return useQuery(
    queryOptions({
      queryKey: adminArtistKeys.all,
      queryFn: listAdminArtists,
      staleTime: 15_000,
    }),
  )
}

/** How many reservations from today on still need this artist; asked only when it matters. */
export function useUpcomingBookingsQuery(artistId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: adminArtistKeys.upcoming(artistId ?? ''),
    queryFn: () => countUpcomingBookings(artistId ?? ''),
    enabled: enabled && artistId !== undefined,
    staleTime: 0,
  })
}

/** The booking forms read the same artists, so their cache goes stale together with ours. */
function useRefreshArtists() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminArtistKeys.all })
    void queryClient.invalidateQueries({ queryKey: artistKeys.all })
  }
}

export function useCreateArtistMutation() {
  const refresh = useRefreshArtists()
  return useMutation({
    mutationFn: (input: ArtistInput) => createArtist(input),
    onSuccess: refresh,
  })
}

export function useUpdateArtistMutation(id: string) {
  const refresh = useRefreshArtists()
  return useMutation({
    mutationFn: (input: ArtistInput) => updateArtist(id, input),
    onSuccess: refresh,
  })
}

export function useDeactivateArtistMutation() {
  const refresh = useRefreshArtists()
  return useMutation({ mutationFn: (id: string) => deactivateArtist(id), onSettled: refresh })
}
