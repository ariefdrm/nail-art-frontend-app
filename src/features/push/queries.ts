import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { getPublicKey, registerSubscription, removeSubscription } from './api'

export const pushKeys = { publicKey: ['push', 'public-key'] as const }

/** The key never changes while the server runs; no retries, a 404 is a final answer (feature off). */
export function usePushKeyQuery() {
  return useQuery(
    queryOptions({
      queryKey: pushKeys.publicKey,
      queryFn: getPublicKey,
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
    }),
  )
}

export function useRegisterSubscriptionMutation() {
  return useMutation({ mutationFn: registerSubscription })
}

export function useRemoveSubscriptionMutation() {
  return useMutation({ mutationFn: removeSubscription })
}
