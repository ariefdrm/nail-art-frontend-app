import { api } from '@/lib/api/client'

import type { Service, ServiceInput } from '@/lib/api/types'

export async function listAdminServices(): Promise<Service[]> {
  const res = await api.get<{ data: Service[] }>('/admin/services')
  return res.data.data
}

export async function createService(input: ServiceInput): Promise<Service> {
  const res = await api.post<{ data: Service }>('/admin/services', input)
  return res.data.data
}

/** PUT replaces the whole service: send every field, not just the changed ones. */
export async function updateService(id: string, input: ServiceInput): Promise<Service> {
  const res = await api.put<{ data: Service }>(`/admin/services/${id}`, input)
  return res.data.data
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/admin/services/${id}`)
}
