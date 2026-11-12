import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useCancelBookingMutation,
  useLookupBookingMutation,
} from '@/features/booking-lookup/queries'
import { useCountdown } from '@/hooks/use-countdown'
import { errorMessage, toApiError } from '@/lib/api/errors'
import { ERROR_COPY, rateLimitedMessage } from '@/lib/copy'
import { normalizePhone } from '@/lib/format'

import { BookingResult } from './booking-result'
import { LookupForm } from './lookup-form'

import type { LookupValues } from '@/features/booking-lookup/schemas'
import type { Booking } from '@/lib/api/types'

/** What cancelling needs to prove ownership again. Kept in memory only, never in storage or the URL. */
type Found = { code: string; phone: string; booking: Booking }

export function BookingLookup() {
  const [found, setFound] = useState<Found | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { secondsLeft, start: startCountdown } = useCountdown()
  const lookup = useLookupBookingMutation()
  const cancel = useCancelBookingMutation()
  const isBlocked = secondsLeft > 0

  /** Every failure to find a booking reads the same: a mismatch must not reveal what exists. */
  function explain(error: unknown) {
    const apiError = toApiError(error)
    if (apiError.status === 429) {
      startCountdown(apiError.retryAfter ?? 60)
      return
    }
    setFound(null)
    setNotice(
      apiError.status === 404 || apiError.status === 422
        ? ERROR_COPY.bookingNotFound
        : errorMessage(apiError),
    )
  }

  async function search(values: LookupValues) {
    setNotice(null)
    const code = values.booking_code.trim().toUpperCase()
    const phone = normalizePhone(values.phone) ?? values.phone
    try {
      setFound({ code, phone, booking: await lookup.mutateAsync({ code, phone }) })
    } catch (error) {
      explain(error)
    }
  }

  async function cancelBooking(reason: string) {
    if (!found) return
    setNotice(null)
    try {
      const booking = await cancel.mutateAsync({
        code: found.code,
        phone: found.phone,
        reason: reason || undefined,
      })
      setFound({ ...found, booking })
      toast.success('Pemesanan dibatalkan')
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'INVALID_STATUS_TRANSITION') {
        // Too late to cancel, or already cancelled: say why, then show the booking as it is now.
        setNotice(errorMessage(apiError))
        try {
          setFound({
            ...found,
            booking: await lookup.mutateAsync({ code: found.code, phone: found.phone }),
          })
        } catch (reloadError) {
          explain(reloadError)
        }
      } else {
        explain(error)
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 py-8 md:py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Cek booking</h1>
        <p className="text-muted-foreground">
          Masukkan kode dan nomor HP yang Anda gunakan saat memesan.
        </p>
      </div>

      <LookupForm onSubmit={search} isBlocked={isBlocked} />

      <div aria-live="polite" className="space-y-4">
        {isBlocked ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertDescription>{rateLimitedMessage(secondsLeft)}</AlertDescription>
          </Alert>
        ) : null}
        {notice ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      {found ? (
        <BookingResult
          booking={found.booking}
          isCancelling={cancel.isPending}
          isBlocked={isBlocked}
          onCancel={(reason) => void cancelBooking(reason)}
        />
      ) : null}
    </div>
  )
}
