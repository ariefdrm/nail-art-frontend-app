import { cn } from '@/lib/utils'

const SAMPLE_TIMES = ['09.00', '10.00', '11.00', '13.00'] as const
const SELECTED_TIME = '10.00'

type BookingPreviewProps = { className?: string }

/**
 * A still picture of the product: the row of times customers pick from. It is illustration, not
 * data (the times are samples), so it is hidden from assistive technology and has no controls.
 */
export function BookingPreview({ className }: BookingPreviewProps) {
  return (
    <div
      aria-hidden
      className={cn('w-full rounded-lg border border-border bg-background p-4', className)}
    >
      <p className="text-xs font-medium text-muted-foreground">Jam tersedia</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {SAMPLE_TIMES.map((time) => (
          <span
            key={time}
            className={cn(
              'flex h-9 items-center justify-center rounded-full border text-xs font-medium tabular-nums',
              time === SELECTED_TIME
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background',
            )}
          >
            {time}
          </span>
        ))}
      </div>
    </div>
  )
}
