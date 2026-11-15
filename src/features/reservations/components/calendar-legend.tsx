import { StatusBadge } from '@/components/common/status-badge'

import type { BookingStatus } from '@/lib/api/types'

const ORDER: readonly BookingStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]

/** Key to the colors used on the calendar; the badges are the same ones used everywhere else. */
export function CalendarLegend() {
  return (
    <ul aria-label="Keterangan status" className="flex flex-wrap gap-2">
      {ORDER.map((status) => (
        <li key={status}>
          <StatusBadge status={status} />
        </li>
      ))}
    </ul>
  )
}
