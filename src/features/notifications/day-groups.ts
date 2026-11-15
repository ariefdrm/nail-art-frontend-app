import { addDaysWib, formatDayKey, toWibDateString } from '@/lib/format'

import type { Notification } from '@/lib/api/types'

export type DayGroup = { day: string; label: string; items: Notification[] }

/** Splits a newest-first list into WIB days, keeping the order: "Hari ini", "Kemarin", a date. */
export function groupByDay(items: Notification[], today: string): DayGroup[] {
  const groups: DayGroup[] = []
  for (const item of items) {
    const day = toWibDateString(item.created_at)
    const last = groups[groups.length - 1]
    if (last?.day === day) {
      last.items.push(item)
      continue
    }
    let label = formatDayKey(day)
    if (day === today) label = 'Hari ini'
    else if (day === addDaysWib(today, -1)) label = 'Kemarin'
    groups.push({ day, label, items: [item] })
  }
  return groups
}
