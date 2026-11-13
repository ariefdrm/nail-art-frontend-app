import { useQueries } from '@tanstack/react-query'

import { availabilityOptions } from '@/lib/api/public-queries'
import { addDaysWib, todayWib } from '@/lib/format'

import { pickNextSlots } from './next-slots'

import type { Service } from '@/lib/api/types'

const DAYS_AHEAD = 3

/** Looks at today and the next days for the first open times of a service (home page teaser). */
export function useNextSlots(service: Pick<Service, 'id'> | undefined) {
  const today = todayWib()
  const days = Array.from({ length: DAYS_AHEAD }, (_, offset) => addDaysWib(today, offset))

  const results = useQueries({
    queries: days.map((day) => ({
      ...availabilityOptions({ service_id: service?.id ?? '', date: day }),
      enabled: service !== undefined,
      retry: false,
    })),
  })

  const isPending = service !== undefined && results.some((result) => result.isPending)
  const next = pickNextSlots(days.map((day, index) => ({ day, slots: results[index]?.data })))
  return { isPending, next, today }
}
