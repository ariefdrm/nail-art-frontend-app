import { MessageCircle } from 'lucide-react'

import { BookingCode } from '@/components/common/booking-code'
import { StatusBadge } from '@/components/common/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { formatDayShort, formatTime } from '@/lib/format'
import { isWhatsAppUrl } from '@/lib/links'

import type { AffectedBooking } from '@/lib/api/types'

type AffectedListProps = { bookings: AffectedBooking[] }

/** Reservations a block runs over, each with a ready WhatsApp message the owner sends by hand. */
export function AffectedList({ bookings }: AffectedListProps) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {bookings.map((booking) => (
        <li key={booking.id} className="space-y-2 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <BookingCode code={booking.booking_code} className="font-medium" />
            <StatusBadge status={booking.status} />
          </div>
          <p>
            <span className="font-medium">{booking.customer_name}</span>, {booking.service_name}
          </p>
          <p className="text-muted-foreground tabular-nums">
            {formatDayShort(booking.start_at)}, {formatTime(booking.start_at)} -{' '}
            {formatTime(booking.end_at)} WIB
          </p>
          {isWhatsAppUrl(booking.contact_url) ? (
            <a
              href={booking.contact_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <MessageCircle aria-hidden />
              Hubungi {booking.customer_name}
              <span className="sr-only"> lewat WhatsApp (tab baru)</span>
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
