import { BellRing, CalendarPlus, CalendarX, Hourglass, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { Notification } from '@/lib/api/types'

type Kind = { icon: typeof BellRing; className: string }

/**
 * Color follows the context, borrowing the booking status tokens: yellow needs the owner's
 * answer, red is something lost or at risk, blue is only a heads-up. The icon differs per kind,
 * so color is never the only signal.
 */
const KIND: Record<Notification['type'], Kind> = {
  new_booking: {
    icon: CalendarPlus,
    className: 'bg-status-pending text-status-pending-foreground',
  },
  unconfirmed_reminder: {
    icon: Hourglass,
    className: 'bg-status-pending text-status-pending-foreground',
  },
  booking_cancelled: {
    icon: CalendarX,
    className: 'bg-status-cancelled text-status-cancelled-foreground',
  },
  schedule_conflict: {
    icon: TriangleAlert,
    className: 'bg-status-cancelled text-status-cancelled-foreground',
  },
  upcoming_reminder: {
    icon: BellRing,
    className: 'bg-status-completed text-status-completed-foreground',
  },
}

export function NotificationIcon({ type }: { type: Notification['type'] }) {
  const { icon: Icon, className } = KIND[type]
  return (
    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', className)}>
      <Icon className="size-5" aria-hidden />
    </span>
  )
}
