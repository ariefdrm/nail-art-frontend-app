import { X } from 'lucide-react'

import { formatDate } from '@/lib/format'

import type { SavedBooking } from '@/lib/saved-bookings'

type SavedBookingsListProps = {
  items: SavedBooking[]
  onPick: (code: string) => void
  onRemove: (code: string) => void
}

/** Codes this browser has seen. Picking one fills the form; the phone number is still needed. */
export function SavedBookingsList({ items, onPick, onRemove }: SavedBookingsListProps) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby="saved-title" className="space-y-3">
      <div>
        <h2 id="saved-title" className="text-sm font-semibold">
          Pesanan di perangkat ini
        </h2>
        <p className="text-sm text-muted-foreground">
          Pilih kode, lalu isi nomor HP Anda. Nomor HP tidak disimpan.
        </p>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <li key={item.code} className="flex items-center gap-1 pr-1">
            <button
              type="button"
              onClick={() => onPick(item.code)}
              className="min-h-14 flex-1 rounded-md px-4 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="block font-mono text-sm tracking-wider">{item.code}</span>
              <span className="block text-sm text-muted-foreground">
                {item.service_name}, {formatDate(item.start_at)}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Hapus kode ${item.code} dari perangkat ini`}
              onClick={() => onRemove(item.code)}
              className="flex size-11 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
