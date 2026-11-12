import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  /** null means "no data": shown as a dash with a short note, never as zero. */
  value: string | null
  note: string
  className?: string
}

export function StatCard({ label, value, note, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-border p-5', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className="mt-2 text-4xl font-semibold tracking-tight tabular-nums"
        aria-label={value ?? `${label}: belum ada data`}
      >
        {value ?? '—'}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {value === null ? 'Belum ada data' : note}
      </p>
    </div>
  )
}
