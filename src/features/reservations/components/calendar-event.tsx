import { Link } from '@tanstack/react-router'

import { STATUS_ICON } from '@/components/common/status-badge'
import { STATUS_LABEL } from '@/lib/copy'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { ReservationSearch } from '@/features/reservations/search'
import type { Booking, BookingStatus } from '@/lib/api/types'

/**
 * Color tells the status at a glance (tokens from styles.css); the icon, the time and the screen
 * reader label still carry it alone. A thick left edge marks every event; requests still waiting
 * for the owner (pending) get a full outline too, because they are the ones that need action.
 */
const EVENT_STYLE: Record<BookingStatus, string> = {
  pending:
    'border border-l-4 border-status-pending-foreground bg-status-pending text-status-pending-foreground',
  confirmed:
    'border-l-4 border-l-status-confirmed-foreground bg-status-confirmed text-status-confirmed-foreground',
  completed:
    'border-l-4 border-l-status-completed-foreground bg-status-completed text-status-completed-foreground',
  cancelled:
    'border-l-4 border-dashed border-l-status-cancelled-foreground/60 bg-status-cancelled text-status-cancelled-foreground line-through',
  no_show:
    'border-l-4 border-dashed border-l-status-no-show-foreground/60 bg-status-no-show text-status-no-show-foreground',
}

export function eventLabel(booking: Booking): string {
  return `${formatTime(booking.start_at)} sampai ${formatTime(booking.end_at)}, ${booking.customer_name}, ${booking.service.name}, ${STATUS_LABEL[booking.status]}`
}

type CalendarEventProps = {
  booking: Booking
  search: ReservationSearch
  /** `block` fills a time slot on the week grid; `line` is one compact row in a month cell. */
  variant: 'block' | 'line'
  /** Geometry only (top, height, left, width): it is computed per booking, which classes cannot. */
  style?: React.CSSProperties
}

export function CalendarEvent({ booking, search, variant, style }: CalendarEventProps) {
  const Icon = STATUS_ICON[booking.status]
  const isSelected = booking.id === search.id

  return (
    <Link
      to="/admin/reservasi"
      search={{ ...search, id: booking.id }}
      aria-label={eventLabel(booking)}
      aria-current={isSelected ? 'true' : undefined}
      style={style}
      className={cn(
        'overflow-hidden rounded-md px-1.5 text-left text-xs outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        EVENT_STYLE[booking.status],
        isSelected && 'ring-2 ring-ring ring-offset-1',
        variant === 'block'
          ? 'flex flex-col gap-0.5 py-1'
          : 'flex items-center gap-1 py-0.5 whitespace-nowrap',
      )}
    >
      {variant === 'block' ? (
        <>
          <span className="flex items-center gap-1 font-medium tabular-nums">
            <Icon className="size-3 shrink-0" aria-hidden />
            {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
          </span>
          <span className="truncate font-medium">{booking.customer_name}</span>
          <span className="truncate opacity-80">{booking.service.name}</span>
        </>
      ) : (
        <>
          <Icon className="size-3 shrink-0" aria-hidden />
          <span className="tabular-nums">{formatTime(booking.start_at)}</span>
          <span className="truncate font-medium">{booking.customer_name}</span>
        </>
      )}
    </Link>
  )
}
