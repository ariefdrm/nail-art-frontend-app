import { Check } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCategory, formatDuration, formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { Service } from '@/lib/api/types'

export type ServicesState = {
  services: Service[] | undefined
  isPending: boolean
  error: unknown
  onRetry: () => void
}

type StepServiceProps = {
  state: ServicesState
  selectedId: string | undefined
  onSelect: (service: Service) => void
}

export function StepService({ state, selectedId, onSelect }: StepServiceProps) {
  if (state.isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Memuat layanan">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-20 w-full" />
        ))}
      </div>
    )
  }
  if (state.error) return <ErrorState error={state.error} onRetry={state.onRetry} />
  if (!state.services || state.services.length === 0) {
    return (
      <EmptyState
        title="Belum ada layanan"
        description="Pemesanan dibuka setelah studio menambahkan layanan."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {state.services.map((service) => {
        const isSelected = service.id === selectedId
        return (
          <li key={service.id}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(service)}
              className={cn(
                'flex min-h-20 w-full items-center justify-between gap-4 rounded-lg border p-4 text-left outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected ? 'border-2 border-foreground' : 'border-input hover:bg-muted',
              )}
            >
              <span>
                <span className="block text-lg font-semibold">{service.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {formatCategory(service.category)}, {formatDuration(service.duration_minutes)}
                </span>
              </span>
              <span className="flex items-center gap-3 font-medium tabular-nums">
                {formatRupiah(service.price)}
                {isSelected ? <Check className="size-5" aria-hidden /> : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
