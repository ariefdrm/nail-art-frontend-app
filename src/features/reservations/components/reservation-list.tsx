import { CalendarX } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useReservationsQuery } from '@/features/reservations/queries'
import { hasActiveFilters, toListParams } from '@/features/reservations/search'
import { cn } from '@/lib/utils'

import { ReservationRow, ROW_GRID } from './reservation-row'

import type { ReservationSearch } from '@/features/reservations/search'

type ReservationListProps = {
  search: ReservationSearch
  onSearchChange: (next: ReservationSearch) => void
}

export function ReservationList({ search, onSearchChange }: ReservationListProps) {
  const query = useReservationsQuery(toListParams(search))

  if (query.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Memuat reservasi">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[3.25rem] w-full" />
        ))}
      </div>
    )
  }
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  }

  const { data: bookings, meta } = query.data

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<CalendarX className="size-6" aria-hidden />}
        title="Belum ada reservasi pada rentang ini."
        description={
          hasActiveFilters(search)
            ? 'Coba ubah atau hapus filter yang sedang aktif.'
            : 'Reservasi baru dari pelanggan akan muncul di sini.'
        }
        action={
          hasActiveFilters(search) ? (
            <Button type="button" variant="outline" onClick={() => onSearchChange({ halaman: 1 })}>
              Hapus filter
            </Button>
          ) : undefined
        }
      />
    )
  }

  const first = (meta.page - 1) * meta.per_page + 1
  const last = first + bookings.length - 1

  return (
    <div
      className={cn('space-y-4', query.isPlaceholderData && 'opacity-60')}
      aria-busy={query.isPlaceholderData}
    >
      <div className="overflow-hidden rounded-lg border border-border">
        <div
          aria-hidden
          className={cn(
            'hidden border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase',
            ROW_GRID,
          )}
        >
          <span>Waktu</span>
          <span>Pelanggan</span>
          <span>Layanan</span>
          <span>Artist</span>
          <span>Status</span>
          <span className="text-right">Harga</span>
        </div>
        <ul>
          {bookings.map((booking) => (
            <ReservationRow
              key={booking.id}
              booking={booking}
              search={search}
              isSelected={booking.id === search.id}
            />
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          Menampilkan {first} - {last} dari {meta.total}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={meta.page <= 1}
            onClick={() => onSearchChange({ ...search, halaman: meta.page - 1 })}
          >
            Sebelumnya
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={meta.page >= meta.total_pages}
            onClick={() => onSearchChange({ ...search, halaman: meta.page + 1 })}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  )
}
