import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { getSummary } from './api'

import type { SummaryRange } from './api'

export const dashboardKeys = {
  summary: (range: SummaryRange) => ['dashboard', 'summary', range] as const,
}

export const summaryOptions = (range: SummaryRange) =>
  queryOptions({
    queryKey: dashboardKeys.summary(range),
    queryFn: () => getSummary(range),
    // Counts move as reservations change, but a minute of lag is fine on a dashboard.
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

export function useSummaryQuery(range: SummaryRange, enabled: boolean) {
  return useQuery({ ...summaryOptions(range), enabled })
}
