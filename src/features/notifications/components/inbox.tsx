import { BellOff, CheckCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
  useUnreadCountQuery,
} from '@/features/notifications/queries'
import { errorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

import { NotificationItem } from './notification-item'

const PER_PAGE = 20

export type InboxSearch = { belum?: boolean | undefined; halaman?: number | undefined }

type InboxProps = { search: InboxSearch; onSearchChange: (next: InboxSearch) => void }

export function Inbox({ search, onSearchChange }: InboxProps) {
  const onlyUnread = search.belum === true
  const page = search.halaman ?? 1
  const query = useNotificationsQuery({
    unread: onlyUnread ? true : undefined,
    page,
    per_page: PER_PAGE,
  })
  const unread = useUnreadCountQuery().data ?? 0
  const markRead = useMarkReadMutation()
  const markAll = useMarkAllReadMutation()

  function readAll() {
    markAll.mutate(undefined, {
      onSuccess: (marked) =>
        toast.success(
          marked > 0 ? `${marked} notifikasi ditandai sudah dibaca` : 'Semua sudah dibaca',
        ),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const meta = query.data?.meta
  const items = query.data?.data ?? []

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan 30 hari terakhir. Status baca hanya berlaku untuk akun Anda."
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={unread === 0 || markAll.isPending}
            onClick={readAll}
          >
            {markAll.isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <CheckCheck aria-hidden />
            )}
            Tandai semua dibaca
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Switch
          id="only-unread"
          checked={onlyUnread}
          onCheckedChange={(checked) =>
            onSearchChange({ belum: checked ? true : undefined, halaman: undefined })
          }
        />
        <Label htmlFor="only-unread" className="text-sm">
          Hanya yang belum dibaca
        </Label>
      </div>

      {query.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Memuat notifikasi">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-16 w-full" />
          ))}
        </div>
      ) : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}

      {query.isSuccess && items.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-6" aria-hidden />}
          title={onlyUnread ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'}
          description={
            onlyUnread
              ? 'Tidak ada yang belum dibaca saat ini.'
              : 'Notifikasi dari 30 hari terakhir akan muncul di sini.'
          }
        />
      ) : null}

      {items.length > 0 && meta ? (
        <div
          className={cn('space-y-4', query.isPlaceholderData && 'opacity-60')}
          aria-live="polite"
        >
          <ul className="overflow-hidden rounded-lg border border-border">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onOpen={(opened) => {
                  if (!opened.read) markRead.mutate(opened.id)
                }}
              />
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground tabular-nums">
              Menampilkan {(meta.page - 1) * meta.per_page + 1} -{' '}
              {(meta.page - 1) * meta.per_page + items.length} dari {meta.total}
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
      ) : null}
    </div>
  )
}
