import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string; icon?: React.ReactNode }

type SegmentedControlProps<T extends string> = {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** A small set of mutually exclusive views, e.g. Daftar | Kalender. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex rounded-lg border border-input p-0.5', className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
