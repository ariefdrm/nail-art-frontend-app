import { STATUS_ICON } from '@/components/common/status-badge'
import { STATUS_LABEL } from '@/lib/copy'

import type { Summary } from '@/features/dashboard/api'
import type { BookingStatus } from '@/lib/api/types'

const ORDER: readonly BookingStatus[] = [
  'confirmed',
  'completed',
  'pending',
  'cancelled',
  'no_show',
]

/** Greys from the chart tokens; the label, icon and count carry the meaning, not the shade. */
const BAR: Record<BookingStatus, string> = {
  confirmed: 'bg-chart-1',
  completed: 'bg-chart-2',
  pending: 'bg-chart-3',
  cancelled: 'bg-chart-4',
  no_show: 'bg-chart-5',
}

type StatusBreakdownProps = { byStatus: Summary['by_status'] }

export function StatusBreakdown({ byStatus }: StatusBreakdownProps) {
  const largest = Math.max(1, ...ORDER.map((status) => byStatus[status]))

  return (
    <section aria-labelledby="breakdown-title" className="space-y-4">
      <h2 id="breakdown-title" className="text-2xl font-semibold tracking-tight">
        Rincian status
      </h2>
      <ul className="space-y-3">
        {ORDER.map((status) => {
          const Icon = STATUS_ICON[status]
          const count = byStatus[status]
          return (
            <li key={status} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="flex items-center gap-2">
                <Icon className="size-4 shrink-0" aria-hidden />
                {STATUS_LABEL[status]}
              </span>
              <span className="h-3 rounded-full bg-muted" aria-hidden>
                {/* Bar length is data, so it cannot be a class; the width is a share of the largest. */}
                <span
                  className={`block h-full rounded-full ${BAR[status]}`}
                  style={{ width: `${(count / largest) * 100}%` }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">{count}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
