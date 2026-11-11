import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { AvailableSlot } from '@/features/booking/api'

const GROUP_THRESHOLD = 8

function periodOf(startAt: string): 'Pagi' | 'Siang' | 'Sore' {
  const hour = Number(formatTime(startAt).split('.')[0])
  if (hour < 11) return 'Pagi'
  if (hour < 15) return 'Siang'
  return 'Sore'
}

type SlotPickerProps = {
  slots: AvailableSlot[] | undefined
  isPending: boolean
  error: unknown
  selected: string | undefined
  onSelect: (startAt: string) => void
  onRetry: () => void
}

export function SlotPicker({
  slots,
  isPending,
  error,
  selected,
  onSelect,
  onRetry,
}: SlotPickerProps) {
  if (isPending) {
    return (
      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-5"
        aria-busy="true"
        aria-label="Memuat jam"
      >
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-11 rounded-full" />
        ))}
      </div>
    )
  }
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (!slots || slots.length === 0) {
    return (
      <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        Tidak ada jadwal tersedia pada tanggal ini, coba tanggal lain.
      </p>
    )
  }

  const groups: { label: string | null; slots: AvailableSlot[] }[] =
    slots.length > GROUP_THRESHOLD
      ? (['Pagi', 'Siang', 'Sore'] as const)
          .map((label) => ({ label, slots: slots.filter((s) => periodOf(s.start_at) === label) }))
          .filter((group) => group.slots.length > 0)
      : [{ label: null, slots }]

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label ?? 'all'} className="space-y-2">
          {group.label ? (
            <p className="text-sm font-medium text-muted-foreground">{group.label}</p>
          ) : null}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {group.slots.map((slot) => {
              const isSelected = slot.start_at === selected
              return (
                <button
                  key={slot.start_at}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(slot.start_at)}
                  className={cn(
                    'h-11 rounded-full border text-sm font-medium tabular-nums outline-none',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-muted',
                  )}
                >
                  {formatTime(slot.start_at)}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
