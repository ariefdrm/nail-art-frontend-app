import { formatDate, formatDuration, formatPhone, formatRupiah, formatTime } from '@/lib/format'

import type { GuestValues } from '@/features/booking/schemas'
import type { Service } from '@/lib/api/types'

type StepReviewProps = {
  service: Service
  startAt: string
  artistName: string | undefined
  guest: GuestValues
}

export function StepReview({ service, startAt, artistName, guest }: StepReviewProps) {
  const rows: [string, string][] = [
    ['Layanan', `${service.name}, ${formatDuration(service.duration_minutes)}`],
    ['Tanggal dan jam', `${formatDate(startAt)}, ${formatTime(startAt)} WIB`],
    ['Artist', artistName ?? 'Ditentukan studio'],
    ['Harga', formatRupiah(service.price)],
    ['Nama', guest.customer_name],
    ['Nomor HP', formatPhone(guest.customer_phone)],
    ...(guest.customer_note ? [['Catatan', guest.customer_note] as [string, string]] : []),
  ]

  return (
    <dl className="divide-y divide-border rounded-lg border border-border">
      {rows.map(([term, value]) => (
        <div key={term} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm text-muted-foreground">{term}</dt>
          <dd className="font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
