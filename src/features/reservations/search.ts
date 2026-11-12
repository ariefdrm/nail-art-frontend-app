import { addDaysWib, todayWib } from '@/lib/format'

import type { ListReservationsParams } from './api'
import type { BookingStatus } from '@/lib/api/types'

/** Everything the reservation list keeps in the URL, so a view can be linked. */
export type ReservationSearch = {
  q?: string | undefined
  status?: BookingStatus | undefined
  artist?: string | undefined
  dari?: string | undefined
  sampai?: string | undefined
  halaman?: number | undefined
  id?: string | undefined
}

export const PER_PAGE = 20
export const DEFAULT_RANGE_DAYS = 7

/** Today up to a week ahead: what the owner looks at first (PRD FE-06). */
export function defaultRange(): Pick<ReservationSearch, 'dari' | 'sampai'> {
  const today = todayWib()
  return { dari: today, sampai: addDaysWib(today, DEFAULT_RANGE_DAYS) }
}

/** True when the URL carries no filter, page or selection at all. */
export function isBlankSearch(search: ReservationSearch): boolean {
  const { q, status, artist, dari, sampai, halaman, id } = search
  return [q, status, artist, dari, sampai, halaman, id].every((value) => value === undefined)
}

export function toListParams(search: ReservationSearch): ListReservationsParams {
  const q = search.q?.trim()
  return {
    date_from: search.dari,
    date_to: search.sampai,
    status: search.status,
    artist_id: search.artist,
    q: q ? q : undefined,
    page: search.halaman ?? 1,
    per_page: PER_PAGE,
  }
}

/** Filters only; page and selected row do not count as "a filter is on". */
export function hasActiveFilters(search: ReservationSearch): boolean {
  return [search.q, search.status, search.artist, search.dari, search.sampai].some(Boolean)
}
