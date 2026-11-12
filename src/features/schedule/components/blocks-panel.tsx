import { CalendarOff, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useBlocksQuery, useDeleteBlockMutation } from '@/features/schedule/queries'
import { errorMessage } from '@/lib/api/errors'
import { useArtistsQuery } from '@/lib/api/public-queries'
import { formatDayShort, formatTime, todayWib, toWibDateString } from '@/lib/format'
import { cn } from '@/lib/utils'

import { NewBlockSheet } from './new-block-sheet'

import type { BlockedSlot } from '@/lib/api/types'

const ROW_GRID = 'md:grid md:grid-cols-[1.4fr_9rem_1fr_5rem] md:items-center md:gap-4'

export type BlocksSearch = { baru?: boolean | undefined; lewat?: boolean | undefined }

type BlocksPanelProps = {
  search: BlocksSearch
  onSearchChange: (next: BlocksSearch) => void
}

function describeRange(block: BlockedSlot): string {
  const sameDay = toWibDateString(block.start_at) === toWibDateString(block.end_at)
  return sameDay
    ? `${formatDayShort(block.start_at)}, ${formatTime(block.start_at)} - ${formatTime(block.end_at)}`
    : `${formatDayShort(block.start_at)} ${formatTime(block.start_at)} - ${formatDayShort(block.end_at)} ${formatTime(block.end_at)}`
}

export function BlocksPanel({ search, onSearchChange }: BlocksPanelProps) {
  const includePast = search.lewat === true
  const query = useBlocksQuery(includePast ? {} : { date_from: todayWib() })
  const artists = useArtistsQuery()
  const remove = useDeleteBlockMutation()
  const [removing, setRemoving] = useState<BlockedSlot | null>(null)

  const scopeOf = (block: BlockedSlot): string =>
    block.artist_id === null
      ? 'Seluruh studio'
      : (artists.data?.find((artist) => artist.id === block.artist_id)?.name ?? 'Satu artist')

  function confirmRemove() {
    if (!removing) return
    remove.mutate(removing.id, {
      onSuccess: () => toast.success('Blokir dihapus. Waktunya bisa dipesan lagi.'),
      onError: (error) => toast.error(errorMessage(error)),
      onSettled: () => setRemoving(null),
    })
  }

  const blocks = query.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Switch
            id="past-blocks"
            checked={includePast}
            onCheckedChange={(checked) =>
              onSearchChange({ ...search, lewat: checked ? true : undefined })
            }
          />
          <Label htmlFor="past-blocks" className="text-sm">
            Tampilkan yang sudah lewat
          </Label>
        </div>
        <Button type="button" onClick={() => onSearchChange({ ...search, baru: true })}>
          <Plus aria-hidden />
          Blokir waktu
        </Button>
      </div>

      {query.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Memuat blokir">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-[3.25rem] w-full" />
          ))}
        </div>
      ) : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.isSuccess && blocks.length === 0 ? (
        <EmptyState
          icon={<CalendarOff className="size-6" aria-hidden />}
          title="Belum ada waktu yang diblokir"
          description="Blokir waktu untuk libur, cuti artist, atau keperluan lain. Waktu itu tidak akan bisa dipesan."
        />
      ) : null}

      {blocks.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div
            aria-hidden
            className={cn(
              'hidden border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase',
              ROW_GRID,
            )}
          >
            <span>Waktu</span>
            <span>Yang diblokir</span>
            <span>Alasan</span>
            <span className="text-right">Tindakan</span>
          </div>
          <ul>
            {blocks.map((block) => (
              <li
                key={block.id}
                className={cn(
                  'space-y-1 border-b border-border px-4 py-3 last:border-b-0 md:space-y-0 md:py-2',
                  ROW_GRID,
                )}
              >
                <p className="font-medium tabular-nums">{describeRange(block)}</p>
                <p className="text-sm">{scopeOf(block)}</p>
                <p className="text-sm text-muted-foreground">{block.reason ?? '-'}</p>
                <div className="md:text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus blokir ${describeRange(block)}`}
                    onClick={() => setRemoving(block)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <NewBlockSheet
        isOpen={search.baru === true}
        onClose={() => onSearchChange({ ...search, baru: undefined })}
      />

      <ConfirmDialog
        isOpen={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        title="Hapus blokir ini?"
        confirmLabel="Hapus blokir"
        isPending={remove.isPending}
        onConfirm={confirmRemove}
      >
        <p>
          {removing ? `${describeRange(removing)}, ${scopeOf(removing)}. ` : ''}
          Waktu ini akan bisa dipesan lagi. Reservasi yang sudah ada tidak berubah.
        </p>
      </ConfirmDialog>
    </div>
  )
}
