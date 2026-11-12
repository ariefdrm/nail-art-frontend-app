import { Link } from '@tanstack/react-router'
import { Plus, UserX, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ActiveBadge } from '@/components/common/active-badge'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminArtistsQuery, useDeactivateArtistMutation } from '@/features/admin-artists/queries'
import { errorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

import { ArtistSheet } from './artist-sheet'
import { UpcomingWarning } from './upcoming-warning'

import type { Artist } from '@/lib/api/types'

const ROW_GRID = 'md:grid md:grid-cols-[1fr_8rem_9rem] md:items-center md:gap-4'

export type ArtistsSearch = { id?: string | undefined; baru?: boolean | undefined }

type ArtistsAdminProps = {
  search: ArtistsSearch
  onSearchChange: (next: ArtistsSearch) => void
}

export function ArtistsAdmin({ search, onSearchChange }: ArtistsAdminProps) {
  const query = useAdminArtistsQuery()
  const deactivate = useDeactivateArtistMutation()
  const [target, setTarget] = useState<Artist | null>(null)

  const artists = [...(query.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'id'))
  const editing = artists.find((artist) => artist.id === search.id)
  const openNew = () => onSearchChange({ baru: true })

  function confirm() {
    if (!target) return
    const name = target.name
    deactivate.mutate(target.id, {
      onSuccess: () => toast.success(`Artist ${name} dinonaktifkan`),
      onError: (error) => toast.error(errorMessage(error)),
      onSettled: () => setTarget(null),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Artist"
        description="Nail artist yang bisa dipilih pelanggan atau ditugaskan pada reservasi."
        actions={
          <Button type="button" onClick={openNew}>
            <Plus aria-hidden />
            Tambah artist
          </Button>
        }
      />

      {query.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Memuat artist">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-[3.25rem] w-full" />
          ))}
        </div>
      ) : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.isSuccess && artists.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" aria-hidden />}
          title="Belum ada artist"
          description="Tambahkan artist pertama supaya reservasi bisa ditugaskan."
          action={
            <Button type="button" onClick={openNew}>
              Tambah artist
            </Button>
          }
        />
      ) : null}

      {artists.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div
            aria-hidden
            className={cn(
              'hidden border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase',
              ROW_GRID,
            )}
          >
            <span>Nama</span>
            <span>Status</span>
            <span className="text-right">Tindakan</span>
          </div>
          <ul>
            {artists.map((artist) => (
              <li
                key={artist.id}
                className={cn(
                  'flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0 md:py-2',
                  ROW_GRID,
                  !artist.is_active && 'text-muted-foreground',
                )}
              >
                <p className="font-medium">{artist.name}</p>
                <div>
                  <ActiveBadge isActive={artist.is_active} />
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <Link
                    to="/admin/artist"
                    search={{ id: artist.id }}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    aria-label={`Ubah ${artist.name}`}
                  >
                    Ubah
                  </Link>
                  {artist.is_active ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Nonaktifkan ${artist.name}`}
                      onClick={() => setTarget(artist)}
                    >
                      <UserX aria-hidden />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ArtistSheet
        isOpen={search.baru === true || editing !== undefined}
        artist={search.baru === true ? undefined : editing}
        onClose={() => onSearchChange({})}
      />

      <ConfirmDialog
        isOpen={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
        title={`Nonaktifkan artist ${target?.name ?? ''}?`}
        confirmLabel="Nonaktifkan"
        isPending={deactivate.isPending}
        onConfirm={confirm}
      >
        <div className="space-y-3">
          <p>
            Artist tidak lagi bisa dipilih untuk reservasi baru, tetapi riwayat dan reservasi yang
            sudah ada tetap utuh. Anda bisa mengaktifkannya lagi lewat tombol Ubah.
          </p>
          <UpcomingWarning artistId={target?.id} isRelevant={target !== null} />
        </div>
      </ConfirmDialog>
    </div>
  )
}
