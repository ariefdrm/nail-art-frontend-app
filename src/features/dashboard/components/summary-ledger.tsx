import { formatMinutes, formatPercent, formatRupiah } from '@/lib/format'

import type { Summary } from '@/features/dashboard/api'

type SummaryProps = { summary: Summary }

/** The one number the owner opens the page for, set large in the display face. */
export function RevenueFigure({ summary }: SummaryProps) {
  const done = summary.by_status.completed
  return (
    <div>
      <p className="text-sm text-muted-foreground">Pendapatan</p>
      <p className="mt-3 font-display text-6xl leading-none font-medium tracking-tight tabular-nums md:text-7xl">
        {formatRupiah(summary.revenue_completed)}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        {done === 0 ? 'Belum ada reservasi selesai' : `dari ${done} reservasi selesai`}
      </p>
    </div>
  )
}

type Metric = {
  label: string
  note: string
  /** null means "no data": shown as a dash with a short note, never as zero. */
  value: string | null
}

function metrics(summary: Summary): Metric[] {
  return [
    { label: 'Total reservasi', note: 'semua status', value: String(summary.total_bookings) },
    {
      label: 'Rasio online',
      note: 'dari semua reservasi',
      value:
        summary.online_booking_ratio === null ? null : formatPercent(summary.online_booking_ratio),
    },
    {
      label: 'Tidak hadir',
      note: 'dari yang selesai atau tidak hadir',
      value: summary.no_show_rate === null ? null : formatPercent(summary.no_show_rate),
    },
    {
      label: 'Rata-rata konfirmasi',
      note: 'reservasi online sampai dikonfirmasi',
      value:
        summary.avg_confirmation_minutes === null
          ? null
          : formatMinutes(summary.avg_confirmation_minutes),
    },
  ]
}

/** Label and note on the left, value on the right, one hairline between rows: a ledger, not cards. */
export function MetricRows({ summary }: SummaryProps) {
  return (
    <dl className="divide-y divide-border border-y border-border">
      {metrics(summary).map((metric) => (
        <div key={metric.label} className="flex items-baseline justify-between gap-6 py-4">
          <div>
            <dt className="font-medium">{metric.label}</dt>
            <dd className="text-sm text-muted-foreground">
              {metric.value === null ? 'Belum ada data' : metric.note}
            </dd>
          </div>
          <dd
            className="text-2xl font-semibold tracking-tight tabular-nums"
            aria-label={metric.value ?? `${metric.label}: belum ada data`}
          >
            {metric.value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}
