import { Link } from '@tanstack/react-router'
import { CircleCheck, Copy, Info } from 'lucide-react'
import { toast } from 'sonner'

import { BookingCode } from '@/components/common/booking-code'
import { EmptyState } from '@/components/common/empty-state'
import { StatusBadge } from '@/components/common/status-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatDate, formatRupiah, formatTime } from '@/lib/format'

import type { BookingConfirmation } from '@/features/booking/api'

type BookingSuccessProps = { booking: BookingConfirmation | undefined }

export function BookingSuccess({ booking }: BookingSuccessProps) {
  if (!booking) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          title="Tidak ada pemesanan untuk ditampilkan"
          description="Kode booking hanya ditampilkan sekali setelah Anda memesan. Gunakan kode dan nomor HP Anda untuk mengecek pesanan."
          action={
            <Link to="/cek-booking" className={buttonVariants({ variant: 'outline' })}>
              Cek status pesanan
            </Link>
          }
        />
      </div>
    )
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Kode booking disalin')
    } catch {
      toast.error('Kode tidak dapat disalin. Salin secara manual.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 py-8 md:py-12">
      <div className="flex items-center gap-3">
        <CircleCheck className="size-8" aria-hidden />
        <h1 className="text-3xl font-semibold tracking-tight">Pemesanan terkirim</h1>
      </div>

      <section aria-labelledby="code-title" className="space-y-2">
        <h2 id="code-title" className="text-sm text-muted-foreground">
          Kode booking Anda
        </h2>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
          <BookingCode code={booking.booking_code} className="text-3xl font-medium" />
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyCode(booking.booking_code)}
          >
            <Copy aria-hidden />
            Salin
          </Button>
        </div>
        <StatusBadge status={booking.status} />
      </section>

      <p className="font-medium tabular-nums">
        {booking.service_name}, {formatDate(booking.start_at)}, {formatTime(booking.start_at)} WIB,{' '}
        {formatRupiah(booking.total_price)}
      </p>

      <Alert>
        <Info aria-hidden />
        <AlertTitle>Pemilik akan mengonfirmasi pesanan Anda</AlertTitle>
        <AlertDescription>
          Simpan kode ini bersama nomor HP Anda untuk mengecek atau membatalkan pesanan.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-3">
        <Link to="/cek-booking" className={buttonVariants({ size: 'lg' })}>
          Cek status pesanan
        </Link>
        <Link to="/" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
          Kembali ke beranda
        </Link>
      </div>
    </div>
  )
}
