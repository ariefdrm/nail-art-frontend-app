import { Link } from '@tanstack/react-router'

import { ErrorState } from '@/components/common/error-state'
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
import { toApiError } from '@/lib/api/errors'
import { useServiceQuery } from '@/lib/api/public-queries'
import { formatCategory, formatDuration, formatRupiah } from '@/lib/format'

import { ServiceImage } from './service-image'

type ServiceDetailSheetProps = {
  serviceId: string | undefined
  onClose: () => void
}

export function ServiceDetailSheet({ serviceId, onClose }: ServiceDetailSheetProps) {
  const query = useServiceQuery(serviceId)
  const isOpen = serviceId !== undefined

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {query.isPending ? (
          <div className="space-y-4 p-6" aria-busy="true">
            <SheetTitle className="sr-only">Memuat layanan</SheetTitle>
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {query.isError ? (
          <div className="space-y-4 p-6">
            <SheetTitle>Layanan tidak dapat dibuka</SheetTitle>
            <SheetDescription>
              {toApiError(query.error).status === 404
                ? 'Layanan ini sudah tidak tersedia.'
                : 'Terjadi kendala saat memuat layanan.'}
            </SheetDescription>
            {toApiError(query.error).status === 404 ? null : (
              <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            )}
          </div>
        ) : null}

        {query.isSuccess ? (
          <>
            <SheetHeader className="p-6 pb-0">
              <SheetTitle className="text-2xl font-semibold tracking-tight">
                {query.data.name}
              </SheetTitle>
              <SheetDescription>
                {formatCategory(query.data.category)}, {formatDuration(query.data.duration_minutes)}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto px-6">
              <ServiceImage service={query.data} />
              <p className="text-xl font-medium tabular-nums">{formatRupiah(query.data.price)}</p>
              {query.data.description ? (
                <p className="max-w-prose text-base whitespace-pre-line text-muted-foreground">
                  {query.data.description}
                </p>
              ) : null}
            </div>
            <SheetFooter className="border-t border-border p-6">
              <Link
                to="/pesan"
                search={{ layanan: query.data.id }}
                className={buttonVariants({ size: 'xl' })}
              >
                Pesan layanan ini
              </Link>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
