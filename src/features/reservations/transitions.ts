import type { BookingStatus } from '@/lib/api/types'

/** The only moves the backend accepts (docs/API_GUIDE.md section 7.2). Final states have none. */
const NEXT: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
}

export function availableTransitions(status: BookingStatus): readonly BookingStatus[] {
  return NEXT[status]
}

/** These two release the slot, so the backend refuses them before the booking starts. */
export function requiresStarted(next: BookingStatus): boolean {
  return next === 'completed' || next === 'no_show'
}

export function canReschedule(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed'
}
