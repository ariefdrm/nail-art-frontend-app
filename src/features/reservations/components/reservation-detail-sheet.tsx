import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { BookingCode } from '@/components/common/booking-code'
import { ErrorState } from '@/components/common/error-state'
import { ScheduleConflictBadge, StatusBadge } from '@/components/common/status-badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useChangeStatusMutation,
  useReservationQuery,
  useUpdateReservationMutation,
} from '@/features/reservations/queries'
import { isWhatsAppUrl } from '@/features/reservations/transitions'
import { errorMessage, toApiError } from '@/lib/api/errors'
import { formatDate, formatDateShort, formatPhone, formatRupiah, formatTime } from '@/lib/format'

import { NotesForm } from './notes-form'
import { ReschedulePanel } from './reschedule-panel'
import { StatusActions } from './status-actions'

import type { UpdateReservationInput } from '@/features/reservations/api'
import type { Booking, BookingStatus } from '@/lib/api/types'

const STATUS_TOAST: Partial<Record<BookingStatus, string>> = {
  confirmed: 'Reservasi dikonfirmasi',
  completed: 'Reservasi ditandai selesai',
  no_show: 'Reservasi ditandai tidak hadir',
  cancelled: 'Reservasi dibatalkan',
}

const SOURCE_LABEL: Record<Booking['source'], string> = { online: 'Online', admin: 'Admin' }

type ReservationDetailSheetProps = { id: string | undefined; onClose: () => void }

export function ReservationDetailSheet({ id, onClose }: ReservationDetailSheetProps) {
  const query = useReservationQuery(id)
  const isGone = query.isError && toApiError(query.error).status === 404

  // A reservation that no longer exists: say so and close the panel (PRD FE-07).
  useEffect(() => {
    if (!isGone) return
    toast.error('Reservasi tidak ditemukan. Daftar dimuat ulang.')
    onClose()
  }, [isGone, onClose])

  return (
    <Sheet
      open={id !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {query.isPending ? (
          <div className="space-y-4 p-6" aria-busy="true">
            <SheetTitle className="sr-only">Memuat reservasi</SheetTitle>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}
        {query.isError && !isGone ? (
          <div className="space-y-4 p-6">
            <SheetTitle>Reservasi tidak dapat dibuka</SheetTitle>
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          </div>
        ) : null}
        {query.isSuccess ? <ReservationDetail booking={query.data} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function ReservationDetail({ booking }: { booking: Booking }) {
  const [isRescheduling, setIsRescheduling] = useState(false)
  const changeStatus = useChangeStatusMutation(booking.id)
  const update = useUpdateReservationMutation(booking.id)
  const isBusy = changeStatus.isPending || update.isPending

  function handleChangeStatus(status: BookingStatus, reason?: string) {
    changeStatus.mutate(
      { status, reason },
      {
        onSuccess: () => toast.success(STATUS_TOAST[status] ?? 'Status diperbarui'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  function handleUpdate(input: UpdateReservationInput, successMessage: string) {
    update.mutate(input, {
      onSuccess: () => {
        toast.success(successMessage)
        setIsRescheduling(false)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <>
      <SheetHeader className="p-6 pb-0">
        <SheetTitle className="text-xl">
          <BookingCode code={booking.booking_code} />
        </SheetTitle>
        <SheetDescription>
          {SOURCE_LABEL[booking.source]}, dibuat {formatDateShort(booking.created_at)}{' '}
          {formatTime(booking.created_at)}
        </SheetDescription>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusBadge status={booking.status} />
          {booking.schedule_conflict ? <ScheduleConflictBadge /> : null}
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-4">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Pelanggan</dt>
            <dd className="font-medium">{booking.customer_name}</dd>
            <dd className="tabular-nums">{formatPhone(booking.customer_phone)}</dd>
            {isWhatsAppUrl(booking.reminder_url) ? (
              <dd className="pt-2">
                <a
                  href={booking.reminder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  <MessageCircle aria-hidden />
                  Hubungi via WhatsApp
                  <span className="sr-only"> (tab baru)</span>
                </a>
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-muted-foreground">Layanan</dt>
            <dd className="font-medium">{booking.service.name}</dd>
            <dd className="tabular-nums">{formatRupiah(booking.total_price)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Jadwal</dt>
            <dd className="font-medium tabular-nums">
              {formatDate(booking.start_at)}, {formatTime(booking.start_at)} -{' '}
              {formatTime(booking.end_at)} WIB
            </dd>
            <dd>Artist: {booking.artist.name}</dd>
          </div>
          {booking.reference_image_url ? (
            <div>
              <dt className="text-muted-foreground">Gambar referensi</dt>
              <dd>
                <a
                  href={booking.reference_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all underline underline-offset-4"
                >
                  Buka tautan
                  <span className="sr-only"> (tab baru)</span>
                </a>
              </dd>
            </div>
          ) : null}
          {booking.cancel_reason ? (
            <div>
              <dt className="text-muted-foreground">Alasan pembatalan</dt>
              <dd>{booking.cancel_reason}</dd>
            </div>
          ) : null}
        </dl>

        {isRescheduling ? (
          <ReschedulePanel
            booking={booking}
            isPending={update.isPending}
            onSave={(input) => handleUpdate(input, 'Jadwal reservasi diperbarui')}
          />
        ) : null}

        <NotesForm
          key={booking.updated_at}
          booking={booking}
          isPending={update.isPending}
          onSave={(input) => handleUpdate(input, 'Catatan disimpan')}
        />
      </div>

      <SheetFooter className="border-t border-border p-6">
        <StatusActions
          booking={booking}
          isPending={isBusy}
          isRescheduling={isRescheduling}
          onChangeStatus={handleChangeStatus}
          onToggleReschedule={() => setIsRescheduling((open) => !open)}
        />
      </SheetFooter>
    </>
  )
}
