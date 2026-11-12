import { Link } from '@tanstack/react-router'

import { ScheduleConflictBadge, StatusBadge } from '@/components/common/status-badge'
import { formatDayShort, formatRupiah, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { ReservationSearch } from '@/features/reservations/search'
import type { Booking } from '@/lib/api/types'

/** One layout for every width: stacked on phones, a six column grid from md up. */
export const ROW_GRID =
  'md:grid md:grid-cols-[8rem_1.2fr_1fr_7rem_12rem_7rem] md:items-center md:gap-4'

const SOURCE_LABEL: Record<Booking['source'], string> = { online: 'Online', admin: 'Admin' }

type ReservationRowProps = {
  booking: Booking
  search: ReservationSearch
  isSelected: boolean
}

export function ReservationRow({ booking, search, isSelected }: ReservationRowProps) {
  return (
    <li>
      <Link
        to="/admin/reservasi"
        search={{ ...search, id: booking.id }}
        aria-current={isSelected ? 'true' : undefined}
        className={cn(
          'block space-y-2 border-b border-border px-4 py-3 outline-none md:[min-height:3.25rem] md:space-y-0 md:py-0',
          ROW_GRID,
          'hover:bg-muted/50 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          isSelected && 'bg-muted',
        )}
      >
        <span className="flex items-baseline gap-2 md:block">
          <span className="font-medium tabular-nums">{formatDayShort(booking.start_at)}</span>
          <span className="text-muted-foreground tabular-nums md:block">
            {formatTime(booking.start_at)}
          </span>
        </span>
        <span className="block">
          <span className="block font-medium">{booking.customer_name}</span>
          <span className="inline-flex h-5 items-center rounded-full border border-border px-2 text-xs text-muted-foreground">
            {SOURCE_LABEL[booking.source]}
          </span>
        </span>
        <span className="block">{booking.service.name}</span>
        <span className="block text-muted-foreground md:text-foreground">
          {booking.artist.name}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          {booking.schedule_conflict ? <ScheduleConflictBadge /> : null}
        </span>
        <span className="block font-medium tabular-nums md:text-right">
          {formatRupiah(booking.total_price)}
        </span>
      </Link>
    </li>
  )
}
