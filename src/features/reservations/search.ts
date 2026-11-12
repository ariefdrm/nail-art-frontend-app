import { endOfWeek, monthGrid, startOfWeek } from '@/lib/calendar-days'
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
  /** Absent means the list. */
  /** The "Reservasi baru" panel is open. */
  baru?: boolean | undefined
  tampilan?: 'kalender' | undefined
  skala?: CalendarScale | undefined
  /** Any day inside the week or month the calendar shows. Absent means today. */
  tanggal?: string | undefined
}

export type CalendarScale = 'minggu' | 'bulan'

export const PER_PAGE = 20
export const DEFAULT_RANGE_DAYS = 7

/** Today up to a week ahead: what the owner looks at first (PRD FE-06). */
export function defaultRange(): Pick<ReservationSearch, 'dari' | 'sampai'> {
  const today = todayWib()
  return { dari: today, sampai: addDaysWib(today, DEFAULT_RANGE_DAYS) }
}

/** True when the URL carries no filter, page or selection at all. */
export function isBlankSearch(search: ReservationSearch): boolean {
  const { q, status, artist, dari, sampai, halaman, id, baru, tampilan, skala, tanggal } = search
  return [q, status, artist, dari, sampai, halaman, id, baru, tampilan, skala, tanggal].every(
    (value) => value === undefined,
  )
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

export function isCalendar(search: ReservationSearch): boolean {
  return search.tampilan === 'kalender'
}

/** The keys that choose how reservations are shown, as opposed to which ones. */
export function viewKeys(search: ReservationSearch): ReservationSearch {
  return { tampilan: search.tampilan, skala: search.skala, tanggal: search.tanggal }
}

/**
 * Filters only; page, selected row and view do not count as "a filter is on". The calendar picks
 * its own dates, so a date range only counts in the list.
 */
export function hasActiveFilters(search: ReservationSearch): boolean {
  const base = [search.q, search.status, search.artist]
  return (isCalendar(search) ? base : [...base, search.dari, search.sampai]).some(Boolean)
}

export function calendarScale(search: ReservationSearch): CalendarScale {
  return search.skala ?? 'minggu'
}

export function calendarAnchor(search: ReservationSearch): string {
  return search.tanggal ?? todayWib()
}

/** The days the calendar must load: the week, or the whole month grid with its spill-over days. */
export function calendarRange(search: ReservationSearch): { from: string; to: string } {
  const anchor = calendarAnchor(search)
  if (calendarScale(search) === 'minggu')
    return { from: startOfWeek(anchor), to: endOfWeek(anchor) }
  const weeks = monthGrid(anchor)
  return { from: weeks[0]?.[0] ?? anchor, to: weeks.at(-1)?.[6] ?? anchor }
}
