import { Link } from '@tanstack/react-router'

import { isSameMonth, monthGrid } from '@/lib/calendar-days'
import { formatDayKey, formatWeekdayShort, todayWib, toWibDateString } from '@/lib/format'
import { cn } from '@/lib/utils'

import { CalendarEvent } from './calendar-event'

import type { ReservationSearch } from '@/features/reservations/search'
import type { Booking } from '@/lib/api/types'

const MAX_LINES = 3

type MonthGridProps = { anchor: string; bookings: Booking[]; search: ReservationSearch }

/** The month at a glance; a day opens its week, where the hours are visible. */
export function MonthGrid({ anchor, bookings, search }: MonthGridProps) {
  const today = todayWib()
  const weeks = monthGrid(anchor)

  const byDay = new Map<string, Booking[]>()
  for (const booking of bookings) {
    const day = toWibDateString(booking.start_at)
    byDay.set(day, [...(byDay.get(day) ?? []), booking])
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border" aria-hidden>
        {weeks[0]?.map((day) => (
          <div key={day} className="py-2 text-center text-xs text-muted-foreground">
            {formatWeekdayShort(day)}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0]} className="grid grid-cols-7">
          {week.map((day) => {
            const items = byDay.get(day) ?? []
            const hidden = items.length - MAX_LINES
            const weekSearch = { ...search, skala: 'minggu' as const, tanggal: day, id: undefined }
            return (
              <div
                key={day}
                className={cn(
                  'min-h-20 space-y-1 border-r border-b border-border p-1 last:border-r-0 sm:min-h-32',
                  !isSameMonth(day, anchor) && 'bg-muted/40 text-muted-foreground',
                )}
              >
                <Link
                  to="/admin/reservasi"
                  search={weekSearch}
                  aria-label={`${formatDayKey(day)}, ${items.length} reservasi. Buka minggunya`}
                  className={cn(
                    'inline-flex size-7 items-center justify-center rounded-full text-sm font-medium tabular-nums outline-none',
                    'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                    day === today && 'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                >
                  {Number(day.slice(8))}
                </Link>
                {items.length > 0 ? (
                  <span className="block text-xs font-medium tabular-nums sm:hidden">
                    {items.length}
                  </span>
                ) : null}
                <ul className="hidden space-y-0.5 sm:block">
                  {items.slice(0, MAX_LINES).map((booking) => (
                    <li key={booking.id}>
                      <CalendarEvent booking={booking} search={search} variant="line" />
                    </li>
                  ))}
                  {hidden > 0 ? (
                    <li>
                      <Link
                        to="/admin/reservasi"
                        search={weekSearch}
                        className="px-1.5 text-xs font-medium underline-offset-4 hover:underline"
                      >
                        +{hidden} lagi
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
