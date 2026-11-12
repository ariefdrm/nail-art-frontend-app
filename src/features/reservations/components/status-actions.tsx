import { CalendarClock, CheckCheck, CircleCheck, UserX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  availableTransitions,
  canReschedule,
  requiresStarted,
} from '@/features/reservations/transitions'
import { hasStarted } from '@/lib/format'

import { CancelReservationDialog } from './cancel-reservation-dialog'

import type { Booking, BookingStatus } from '@/lib/api/types'

const NOT_STARTED_HINT = 'Tersedia setelah jadwal dimulai.'

type StatusActionsProps = {
  booking: Booking
  isPending: boolean
  isRescheduling: boolean
  onChangeStatus: (status: BookingStatus, reason?: string) => void
  onToggleReschedule: () => void
}

export function StatusActions({
  booking,
  isPending,
  isRescheduling,
  onChangeStatus,
  onToggleReschedule,
}: StatusActionsProps) {
  const transitions = availableTransitions(booking.status)
  const started = hasStarted(booking.start_at)
  const waitsForStart = transitions.some((next) => requiresStarted(next)) && !started

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Status ini sudah final dan tidak dapat diubah.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {transitions.includes('confirmed') ? (
          <Button type="button" disabled={isPending} onClick={() => onChangeStatus('confirmed')}>
            <CircleCheck aria-hidden />
            Konfirmasi
          </Button>
        ) : null}
        {transitions.includes('completed') ? (
          <Button
            type="button"
            disabled={isPending || !started}
            onClick={() => onChangeStatus('completed')}
          >
            <CheckCheck aria-hidden />
            Tandai selesai
          </Button>
        ) : null}
        {transitions.includes('no_show') ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !started}
            onClick={() => onChangeStatus('no_show')}
          >
            <UserX aria-hidden />
            Tidak hadir
          </Button>
        ) : null}
        {canReschedule(booking.status) ? (
          <Button
            type="button"
            variant="outline"
            aria-pressed={isRescheduling}
            disabled={isPending}
            onClick={onToggleReschedule}
          >
            <CalendarClock aria-hidden />
            Jadwalkan ulang
          </Button>
        ) : null}
        {transitions.includes('cancelled') ? (
          <CancelReservationDialog
            bookingCode={booking.booking_code}
            isPending={isPending}
            onConfirm={(reason) => onChangeStatus('cancelled', reason)}
          />
        ) : null}
      </div>
      {waitsForStart ? <p className="text-xs text-muted-foreground">{NOT_STARTED_HINT}</p> : null}
    </div>
  )
}
