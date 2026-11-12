import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { availabilityKeys } from '@/lib/api/public-queries'
import { RESERVATIONS_KEY } from '@/lib/api/query-keys'

import {
  checkBlock,
  createBlock,
  deleteBlock,
  getBusinessHours,
  listBlocks,
  putBusinessHours,
} from './api'

import type { BlockInput, ListBlocksParams } from './api'
import type { BusinessHour } from '@/lib/api/types'

export const scheduleKeys = {
  hours: ['schedule', 'hours'] as const,
  blocks: (params: ListBlocksParams) => ['schedule', 'blocks', params] as const,
  allBlocks: ['schedule', 'blocks'] as const,
}

export function useBusinessHoursQuery() {
  return useQuery(
    queryOptions({
      queryKey: scheduleKeys.hours,
      queryFn: getBusinessHours,
      staleTime: 60_000,
    }),
  )
}

export function useBlocksQuery(params: ListBlocksParams) {
  return useQuery(
    queryOptions({
      queryKey: scheduleKeys.blocks(params),
      queryFn: () => listBlocks(params),
      staleTime: 15_000,
    }),
  )
}

/** Hours and blocks decide which slots exist, and blocks flag reservations as conflicting. */
function useRefreshSchedule() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['schedule'] })
    void queryClient.invalidateQueries({ queryKey: availabilityKeys.all })
    void queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY })
  }
}

export function useSaveBusinessHoursMutation() {
  const refresh = useRefreshSchedule()
  return useMutation({
    mutationFn: (hours: BusinessHour[]) => putBusinessHours(hours),
    onSuccess: refresh,
  })
}

export function useCheckBlockMutation() {
  return useMutation({ mutationFn: (input: BlockInput) => checkBlock(input) })
}

export function useCreateBlockMutation() {
  const refresh = useRefreshSchedule()
  return useMutation({ mutationFn: (input: BlockInput) => createBlock(input), onSuccess: refresh })
}

export function useDeleteBlockMutation() {
  const refresh = useRefreshSchedule()
  return useMutation({ mutationFn: (id: string) => deleteBlock(id), onSuccess: refresh })
}
