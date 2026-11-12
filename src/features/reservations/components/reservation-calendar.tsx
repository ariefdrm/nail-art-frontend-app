import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useCalendarQuery } from '@/features/reservations/queries'
import { calendarAnchor, calendarRange, calendarScale } from '@/features/reservations/search'
import { addMonths, endOfWeek, startOfWeek, weekDays } from '@/lib/calendar-days'
import { addDaysWib, formatDayRange, formatMonthYear, todayWib } from '@/lib/format'
import { cn } from '@/lib/utils'

import { CalendarToolbar } from './calendar-toolbar'
import { MonthGrid } from './month-grid'
import { WeekGrid } from './week-grid'

import type { CalendarScale, ReservationSearch } from '@/features/reservations/search'

type ReservationCalendarProps = {
  search: ReservationSearch
  onSearchChange: (next: ReservationSearch) => void
}

export function ReservationCalendar({ search, onSearchChange }: ReservationCalendarProps) {
  const anchor = calendarAnchor(search)
  const scale = calendarScale(search)
  const range = calendarRange(search)
  const query = useCalendarQuery({
    date_from: range.from,
    date_to: range.to,
    status: search.status,
    artist_id: search.artist,
    q: search.q?.trim() || undefined,
  })

  const label =
    scale === 'minggu'
      ? formatDayRange(startOfWeek(anchor), endOfWeek(anchor))
      : formatMonthYear(anchor)

  function moveBy(direction: 1 | -1) {
    const tanggal =
      scale === 'minggu' ? addDaysWib(anchor, 7 * direction) : addMonths(anchor, direction)
    onSearchChange({ ...search, tanggal, id: undefined })
  }

  function changeScale(next: CalendarScale) {
    onSearchChange({ ...search, skala: next, tanggal: anchor })
  }

  return (
    <div className="space-y-4">
      <CalendarToolbar
        label={label}
        scale={scale}
        onScaleChange={changeScale}
        onPrevious={() => moveBy(-1)}
        onNext={() => moveBy(1)}
        onToday={() => onSearchChange({ ...search, tanggal: todayWib(), id: undefined })}
      />

      {query.isPending ? (
        <Skeleton className="h-96 w-full" aria-busy="true" aria-label="Memuat kalender" />
      ) : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.isSuccess ? (
        <div
          className={cn('space-y-3', query.isPlaceholderData && 'opacity-60')}
          aria-busy={query.isPlaceholderData}
        >
          {query.data.length === 0 ? (
            <p className="text-sm text-muted-foreground" role="status">
              {scale === 'minggu'
                ? 'Tidak ada reservasi pada minggu ini.'
                : 'Tidak ada reservasi pada bulan ini.'}
            </p>
          ) : null}
          {scale === 'minggu' ? (
            <WeekGrid days={weekDays(anchor)} bookings={query.data} search={search} />
          ) : (
            <MonthGrid anchor={anchor} bookings={query.data} search={search} />
          )}
        </div>
      ) : null}
    </div>
  )
}
