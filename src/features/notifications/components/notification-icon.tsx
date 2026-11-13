import { BellRing, CalendarPlus, CalendarX, Hourglass, TriangleAlert } from 'lucide-react'

import type { Notification } from '@/lib/api/types'

const ICON: Record<Notification['type'], typeof BellRing> = {
  new_booking: CalendarPlus,
  booking_cancelled: CalendarX,
  unconfirmed_reminder: Hourglass,
  upcoming_reminder: BellRing,
  schedule_conflict: TriangleAlert,
}

/** A different icon per kind, inside a 32px outlined circle (DESIGN_SPEC section 6). */
export function NotificationIcon({ type }: { type: Notification['type'] }) {
  const Icon = ICON[type]
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border">
      <Icon className="size-4" aria-hidden />
    </span>
  )
}
