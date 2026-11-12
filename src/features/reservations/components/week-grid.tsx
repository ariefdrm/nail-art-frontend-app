import { gridHours, layoutDay } from '@/features/reservations/calendar-layout'
import { formatDayKey, formatWeekdayShort, todayWib, toWibDateString } from '@/lib/format'
import { cn } from '@/lib/utils'

import { CalendarEvent } from './calendar-event'

import type { ReservationSearch } from '@/features/reservations/search'
import type { Booking } from '@/lib/api/types'

const COLUMNS = 'grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]'
const HOUR_ROW = 'h-16'

type WeekGridProps = { days: string[]; bookings: Booking[]; search: ReservationSearch }

/** Monday to Sunday, one row per hour, each reservation a block as tall as its duration. */
export function WeekGrid({ days, bookings, search }: WeekGridProps) {
  const today = todayWib()
  const columns = days.map((day) => ({
    day,
    placed: layoutDay(bookings.filter((booking) => toWibDateString(booking.start_at) === day)),
  }))
  const { firstHour, lastHour } = gridHours(columns.flatMap((column) => column.placed))
  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index)
  const totalMinutes = (lastHour - firstHour) * 60

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="min-w-3xl">
        <div className={cn(COLUMNS, 'border-b border-border')}>
          <div className="sticky left-0 z-10 bg-background" />
          {columns.map(({ day }) => (
            <div key={day} className="border-l border-border py-2 text-center">
              <span className="block text-xs text-muted-foreground">{formatWeekdayShort(day)}</span>
              <span
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                  day === today && 'bg-primary text-primary-foreground',
                )}
              >
                {Number(day.slice(8))}
              </span>
              {day === today ? <span className="sr-only"> (hari ini)</span> : null}
            </div>
          ))}
        </div>

        <div className={COLUMNS}>
          <div className="sticky left-0 z-10 bg-background" aria-hidden>
            {hours.map((hour) => (
              <div
                key={hour}
                className={cn(
                  HOUR_ROW,
                  'pt-1 pr-2 text-right text-xs text-muted-foreground tabular-nums',
                )}
              >
                {String(hour).padStart(2, '0')}.00
              </div>
            ))}
          </div>
          {columns.map(({ day, placed }) => (
            <div key={day} className="relative border-l border-border">
              {hours.map((hour) => (
                <div key={hour} className={cn(HOUR_ROW, 'border-b border-border')} aria-hidden />
              ))}
              <ol aria-label={formatDayKey(day)} className="absolute inset-0">
                {placed.map((item) => {
                  const top = ((item.startMin - firstHour * 60) / totalMinutes) * 100
                  const height = ((item.endMin - item.startMin) / totalMinutes) * 100
                  return (
                    <li
                      key={item.booking.id}
                      className="absolute p-px"
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        left: `${(item.lane / item.lanes) * 100}%`,
                        width: `${100 / item.lanes}%`,
                      }}
                    >
                      <CalendarEvent
                        booking={item.booking}
                        search={search}
                        variant="block"
                        style={{ height: '100%' }}
                      />
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
