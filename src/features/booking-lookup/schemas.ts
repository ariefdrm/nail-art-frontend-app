import { z } from 'zod'

import { normalizePhone } from '@/lib/format'

const CODE_PATTERN = /^NP-\d{8}-[A-Z0-9]{4}$/i

export const lookupSchema = z.object({
  booking_code: z
    .string()
    .trim()
    .min(1, 'Kode booking wajib diisi')
    .refine((value) => CODE_PATTERN.test(value), {
      message: 'Kode booking tidak sesuai. Contoh: NP-20261110-A7K2',
    }),
  phone: z
    .string()
    .trim()
    .min(1, 'Nomor HP wajib diisi')
    .refine((value) => normalizePhone(value) !== null, {
      message: 'Nomor HP tidak valid. Contoh: 0812 3456 7890',
    }),
})

export type LookupValues = z.infer<typeof lookupSchema>

export const MAX_CANCEL_REASON = 255
