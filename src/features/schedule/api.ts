import { api } from '@/lib/api/client'

import type { BlockCheck, BlockedSlot, BlockedSlotCreated, BusinessHour } from '@/lib/api/types'

export type BlockInput = {
  start_at: string
  end_at: string
  /** Absent means the whole studio. */
  artist_id?: string | undefined
  reason?: string | undefined
  acknowledge_conflicts?: boolean | undefined
}

export type ListBlocksParams = { date_from?: string | undefined; date_to?: string | undefined }

export async function getBusinessHours(): Promise<BusinessHour[]> {
  const res = await api.get<{ data: BusinessHour[] }>('/admin/business-hours')
  return res.data.data
}

/** Replaces the whole week at once: exactly seven distinct days. */
export async function putBusinessHours(hours: BusinessHour[]): Promise<BusinessHour[]> {
  const res = await api.put<{ data: BusinessHour[] }>('/admin/business-hours', { hours })
  return res.data.data
}

export async function listBlocks(params: ListBlocksParams): Promise<BlockedSlot[]> {
  const res = await api.get<{ data: BlockedSlot[] }>('/admin/blocked-slots', { params })
  return res.data.data
}

/** Previews which active reservations a block would run over. Nothing is changed. */
export async function checkBlock(input: BlockInput): Promise<BlockCheck> {
  const res = await api.post<{ data: BlockCheck }>('/admin/blocked-slots/check', {
    start_at: input.start_at,
    end_at: input.end_at,
    artist_id: input.artist_id,
  })
  return res.data.data
}

export async function createBlock(input: BlockInput): Promise<BlockedSlotCreated> {
  const res = await api.post<{ data: BlockedSlotCreated }>('/admin/blocked-slots', input)
  return res.data.data
}

export async function deleteBlock(id: string): Promise<void> {
  await api.delete(`/admin/blocked-slots/${id}`)
}
