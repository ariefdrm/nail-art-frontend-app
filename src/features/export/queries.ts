import { useMutation } from '@tanstack/react-query'

import { saveBlob } from '@/lib/download'

import { downloadBookingsCsv } from './api'

import type { ExportParams } from './api'

/** A mutation, not a query: nothing is worth caching and each press should fetch fresh data. */
export function useExportCsvMutation() {
  return useMutation({
    mutationFn: async (params: ExportParams) => {
      const file = await downloadBookingsCsv(params)
      saveBlob(file.blob, file.filename)
      return file.filename
    },
  })
}
