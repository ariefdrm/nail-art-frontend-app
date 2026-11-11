import { api } from '@/lib/api/client'

import type { Service } from '@/lib/api/types'

export async function listServices(category?: string): Promise<Service[]> {
  const res = await api.get<{ data: Service[] }>('/services', {
    params: category ? { category } : undefined,
  })
  return res.data.data
}

export async function getService(id: string): Promise<Service> {
  const res = await api.get<{ data: Service }>(`/services/${id}`)
  return res.data.data
}
