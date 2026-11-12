import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { serviceKeys } from '@/lib/api/public-queries'

import { createService, deleteService, listAdminServices, updateService } from './api'

import type { ServiceInput } from '@/lib/api/types'

export const adminServiceKeys = { all: ['admin', 'services'] as const }

export const adminServicesOptions = () =>
  queryOptions({
    queryKey: adminServiceKeys.all,
    queryFn: listAdminServices,
    staleTime: 15_000,
  })

export function useAdminServicesQuery() {
  return useQuery(adminServicesOptions())
}

/** The customer site reads the same services, so its cache goes stale together with ours. */
function useRefreshServices() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminServiceKeys.all })
    void queryClient.invalidateQueries({ queryKey: serviceKeys.all })
  }
}

export function useCreateServiceMutation() {
  const refresh = useRefreshServices()
  return useMutation({
    mutationFn: (input: ServiceInput) => createService(input),
    onSuccess: refresh,
  })
}

export function useUpdateServiceMutation(id: string) {
  const refresh = useRefreshServices()
  return useMutation({
    mutationFn: (input: ServiceInput) => updateService(id, input),
    onSuccess: refresh,
  })
}

export type DeleteOutcome = 'deleted' | 'deactivated'

/**
 * The API answers 204 whether it removed the service or only switched it off (because bookings
 * refer to it). Reading the list again tells which one happened, so the screen can say so.
 */
export function useDeleteServiceMutation() {
  const refresh = useRefreshServices()
  return useMutation({
    mutationFn: async (id: string): Promise<DeleteOutcome> => {
      await deleteService(id)
      const services = await listAdminServices()
      return services.some((service) => service.id === id) ? 'deactivated' : 'deleted'
    },
    onSettled: refresh,
  })
}
