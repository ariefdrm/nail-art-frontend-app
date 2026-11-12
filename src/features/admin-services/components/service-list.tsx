import { Link } from '@tanstack/react-router'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ActiveBadge } from '@/components/common/active-badge'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminServicesQuery, useDeleteServiceMutation } from '@/features/admin-services/queries'
import { errorMessage } from '@/lib/api/errors'
import { formatCategory, formatDuration, formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'

import { ServiceSheet } from './service-sheet'

import type { Service } from '@/lib/api/types'

const ROW_GRID = 'md:grid md:grid-cols-[1.6fr_7rem_8rem_7rem_9rem] md:items-center md:gap-4'

export type ServicesSearch = { id?: string | undefined; baru?: boolean | undefined }

type ServicesAdminProps = {
  search: ServicesSearch
  onSearchChange: (next: ServicesSearch) => void
}

export function ServicesAdmin({ search, onSearchChange }: ServicesAdminProps) {
  const query = useAdminServicesQuery()
  const remove = useDeleteServiceMutation()
  const [deleting, setDeleting] = useState<Service | null>(null)

  const services = [...(query.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'id'))
  const editing = services.find((service) => service.id === search.id)
  const categories = [...new Set(services.map((service) => service.category))].sort()
  const openNew = () => onSearchChange({ baru: true })

  function confirmDelete() {
    if (!deleting) return
    const name = deleting.name
    remove.mutate(deleting.id, {
      onSuccess: (outcome) =>
        toast.success(
          outcome === 'deleted'
            ? `Layanan ${name} dihapus`
            : `Layanan ${name} dinonaktifkan karena sudah punya reservasi`,
        ),
      onError: (error) => toast.error(errorMessage(error)),
      onSettled: () => setDeleting(null),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Layanan"
        description="Daftar layanan yang tampil di situs dan bisa dipesan pelanggan."
        actions={
          <Button type="button" onClick={openNew}>
            <Plus aria-hidden />
            Tambah layanan
          </Button>
        }
      />

      {query.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Memuat layanan">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-[3.25rem] w-full" />
          ))}
        </div>
      ) : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.isSuccess && services.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" aria-hidden />}
          title="Belum ada layanan"
          description="Tambahkan layanan pertama supaya pelanggan bisa memesan."
          action={
            <Button type="button" onClick={openNew}>
              Tambah layanan
            </Button>
          }
        />
      ) : null}

      {services.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div
            aria-hidden
            className={cn(
              'hidden border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase',
              ROW_GRID,
            )}
          >
            <span>Layanan</span>
            <span>Durasi</span>
            <span>Harga</span>
            <span>Status</span>
            <span className="text-right">Tindakan</span>
          </div>
          <ul>
            {services.map((service) => (
              <li
                key={service.id}
                className={cn(
                  'space-y-2 border-b border-border px-4 py-3 last:border-b-0 md:space-y-0 md:py-2',
                  ROW_GRID,
                  !service.is_active && 'text-muted-foreground',
                )}
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCategory(service.category)}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatDuration(service.duration_minutes)}</p>
                <p className="font-medium tabular-nums">{formatRupiah(service.price)}</p>
                <div>
                  <ActiveBadge isActive={service.is_active} />
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <Link
                    to="/admin/layanan"
                    search={{ id: service.id }}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    aria-label={`Ubah ${service.name}`}
                  >
                    Ubah
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus ${service.name}`}
                    onClick={() => setDeleting(service)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ServiceSheet
        isOpen={search.baru === true || editing !== undefined}
        service={search.baru === true ? undefined : editing}
        categories={categories}
        onClose={() => onSearchChange({})}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title={`Hapus layanan ${deleting?.name ?? ''}?`}
        confirmLabel="Hapus layanan"
        isPending={remove.isPending}
        onConfirm={confirmDelete}
      >
        <p>
          Layanan tanpa reservasi dihapus permanen. Layanan yang sudah punya reservasi hanya
          dinonaktifkan, supaya riwayat reservasinya tetap utuh.
        </p>
      </ConfirmDialog>
    </div>
  )
}
