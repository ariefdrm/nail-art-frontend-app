import { TriangleAlert } from 'lucide-react'

import { BookingCode } from '@/components/common/booking-code'
import { StatusBadge } from '@/components/common/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDate, formatRupiah, formatTime } from '@/lib/format'

import { CancelBookingDialog } from './cancel-booking-dialog'

import type { Booking } from '@/lib/api/types'

type BookingResultProps = {
  booking: Booking
  isCancelling: boolean
  isBlocked: boolean
  onCancel: (reason: string) => void
}

export function BookingResult({ booking, isCancelling, isBlocked, onCancel }: BookingResultProps) {
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed'

  return (
    <section
      aria-labelledby="result-title"
      className="space-y-6 rounded-lg border border-border p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="result-title" className="sr-only">
          Hasil pencarian
        </h2>
        <StatusBadge status={booking.status} />
        <BookingCode code={booking.booking_code} className="text-lg font-medium" />
      </div>

      <div>
        <p className="text-lg font-semibold">{booking.service.name}</p>
        <p className="tabular-nums">
          {formatDate(booking.start_at)}, {formatTime(booking.start_at)} -{' '}
          {formatTime(booking.end_at)} WIB
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Artist</dt>
          <dd className="font-medium">{booking.artist.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Harga</dt>
          <dd className="font-medium tabular-nums">{formatRupiah(booking.total_price)}</dd>
        </div>
      </dl>

      {booking.schedule_conflict ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription>
            Jadwal Anda terpengaruh perubahan jadwal studio. Pemilik akan menghubungi Anda.
          </AlertDescription>
        </Alert>
      ) : null}

      {canCancel ? (
        <CancelBookingDialog
          bookingCode={booking.booking_code}
          isPending={isCancelling}
          isBlocked={isBlocked}
          onConfirm={onCancel}
        />
      ) : null}
    </section>
  )
}
