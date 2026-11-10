import { QueryClient } from '@tanstack/react-query'

import { toApiError } from '@/lib/api/errors'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry GETs once, and only when the network failed (PRD section 8).
        retry: (failureCount, error) => failureCount < 1 && toApiError(error).isNetwork,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  })
}
