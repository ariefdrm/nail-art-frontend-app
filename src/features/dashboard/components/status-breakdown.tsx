import { STATUS_ICON } from '@/components/common/status-badge'
import { STATUS_LABEL } from '@/lib/copy'
import { formatPercent } from '@/lib/format'

import type { Summary } from '@/features/dashboard/api'
import type { BookingStatus } from '@/lib/api/types'

/** Follows the life of a booking, from waiting to finished, then the ones that fell away. */
const ORDER: readonly BookingStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]

/** Same tokens as the status badges, so a segment matches the badge a booking wears. */
const SEGMENT: Record<BookingStatus, string> = {
  pending: 'bg-status-pending-foreground',
  confirmed: 'bg-status-confirmed-foreground',
  completed: 'bg-status-completed-foreground',
  cancelled: 'bg-status-cancelled-foreground',
  no_show: 'bg-status-no-show-foreground',
}

type StatusBreakdownProps = { byStatus: Summary['by_status'] }

export function StatusBreakdown({ byStatus }: StatusBreakdownProps) {
  const total = ORDER.reduce((sum, status) => sum + byStatus[status], 0)

  return (
    <section aria-labelledby="breakdown-title" className="space-y-5">
      <h2 id="breakdown-title" className="font-display text-3xl font-medium tracking-tight">
        Rincian status
      </h2>

      {/* The bar is a summary of the list below it, so assistive technology skips it. */}
      <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
        {total > 0
          ? ORDER.filter((status) => byStatus[status] > 0).map((status) => (
              <span
                key={status}
                className={`block h-full transition-[width] duration-700 ${SEGMENT[status]}`}
                style={{ width: `${(byStatus[status] / total) * 100}%` }}
              />
            ))
          : null}
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground">Belum ada reservasi pada rentang ini.</p>
      ) : null}

      <ul className="divide-y divide-border border-y border-border">
        {ORDER.map((status) => {
          const Icon = STATUS_ICON[status]
          const count = byStatus[status]
          return (
            <li key={status} className="flex items-center gap-3 py-3 text-sm">
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${SEGMENT[status]}`} />
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{STATUS_LABEL[status]}</span>
              {total > 0 ? (
                <span className="text-muted-foreground tabular-nums">
                  {formatPercent(count / total)}
                </span>
              ) : null}
              <span className="w-10 text-right text-base font-semibold tabular-nums">{count}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
