import { api } from '@/lib/api/client'

import type { BookingStatus, DashboardSummary } from '@/lib/api/types'

export type SummaryRange = { dari: string; sampai: string }

/** The summary with every count present: the API may leave a status out when it is zero. */
export type Summary = {
  total_bookings: number
  by_status: Record<BookingStatus, number>
  /** 0..1, or null when there is nothing to divide by. Never show null as 0%. */
  no_show_rate: number | null
  online_booking_ratio: number | null
  revenue_completed: number
  avg_confirmation_minutes: number | null
}

export async function getSummary(range: SummaryRange): Promise<Summary> {
  const res = await api.get<{ data: DashboardSummary }>('/admin/dashboard/summary', {
    params: { date_from: range.dari, date_to: range.sampai },
  })
  const data = res.data.data
  return {
    total_bookings: data.total_bookings,
    by_status: {
      pending: data.by_status.pending ?? 0,
      confirmed: data.by_status.confirmed ?? 0,
      completed: data.by_status.completed ?? 0,
      cancelled: data.by_status.cancelled ?? 0,
      no_show: data.by_status.no_show ?? 0,
    },
    no_show_rate: data.no_show_rate,
    online_booking_ratio: data.online_booking_ratio,
    revenue_completed: data.revenue_completed,
    avg_confirmation_minutes: data.avg_confirmation_minutes,
  }
}
