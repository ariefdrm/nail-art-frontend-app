import { api } from '@/lib/api/client'
import { readHeader } from '@/lib/api/headers'
import { filenameFromDisposition } from '@/lib/download'

import type { BookingStatus } from '@/lib/api/types'

export type ExportParams = {
  date_from?: string | undefined
  date_to?: string | undefined
  status?: BookingStatus | undefined
}

export type CsvFile = { blob: Blob; filename: string }

/** Used when the browser cannot read Content-Disposition (the API does not expose it, PRD Q-07). */
export function fallbackFilename(params: ExportParams): string {
  return `bookings_${params.date_from ?? 'awal'}_${params.date_to ?? 'akhir'}.csv`
}

/**
 * The export is protected by the bearer token, so a plain link would arrive unauthenticated:
 * fetch it as a blob through the API client and let the caller save it.
 */
export async function downloadBookingsCsv(params: ExportParams): Promise<CsvFile> {
  const res = await api.get<Blob>('/admin/export/bookings.csv', {
    params,
    responseType: 'blob',
  })
  const header = readHeader(res.headers, 'content-disposition')
  return {
    blob: res.data,
    filename:
      filenameFromDisposition(typeof header === 'string' ? header : null) ??
      fallbackFilename(params),
  }
}
