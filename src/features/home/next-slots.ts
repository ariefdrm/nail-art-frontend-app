import { hasStarted } from '@/lib/format'

import type { AvailableSlot } from '@/lib/api/public-data'

export type DaySlots = { day: string; slots: AvailableSlot[] | undefined }
export type NextSlots = { day: string; slots: AvailableSlot[] }

/** The first day that still has a slot in the future, with its slots in the order given. */
export function pickNextSlots(days: DaySlots[]): NextSlots | null {
  for (const { day, slots } of days) {
    const open = (slots ?? []).filter((slot) => !hasStarted(slot.start_at))
    if (open.length > 0) return { day, slots: open }
  }
  return null
}
