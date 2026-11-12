import { z } from 'zod'

import { EMPTY_GUEST, guestSchema } from '@/lib/guest-schema'

/** The admin form: the customer's details plus the choices the wizard spreads over its steps. */
export const manualReservationSchema = guestSchema.extend({
  service_id: z.string().min(1, 'Pilih layanan'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pilih tanggal'),
  start_at: z.string().min(1, 'Pilih jam'),
  /** Empty means "the system picks a free artist". */
  artist_id: z.string(),
})

export type ManualReservationValues = z.infer<typeof manualReservationSchema>

export const EMPTY_MANUAL: ManualReservationValues = {
  ...EMPTY_GUEST,
  service_id: '',
  date: '',
  start_at: '',
  artist_id: '',
}

/** Field names the API can report on this form (`date` is ours, the API never sees it). */
export const MANUAL_FIELDS = [
  'service_id',
  'start_at',
  'artist_id',
  'customer_name',
  'customer_phone',
  'customer_note',
  'reference_image_url',
] as const
