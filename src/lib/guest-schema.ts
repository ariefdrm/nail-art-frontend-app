import { z } from 'zod'

import { normalizePhone } from '@/lib/format'

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const guestSchema = z.object({
  customer_name: z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 huruf'),
  customer_phone: z
    .string()
    .trim()
    .min(1, 'Nomor HP wajib diisi')
    .refine((value) => normalizePhone(value) !== null, {
      message: 'Nomor HP tidak valid. Contoh: 0812 3456 7890',
    }),
  customer_note: z.string().trim().max(500, 'Catatan maksimal 500 huruf'),
  reference_image_url: z
    .string()
    .trim()
    .max(2048, 'Tautan terlalu panjang')
    .refine((value) => value === '' || isHttpUrl(value), {
      message: 'Tautan harus diawali http:// atau https://',
    }),
})

export type GuestValues = z.infer<typeof guestSchema>

export const GUEST_FIELDS = [
  'customer_name',
  'customer_phone',
  'customer_note',
  'reference_image_url',
] as const

export const EMPTY_GUEST: GuestValues = {
  customer_name: '',
  customer_phone: '',
  customer_note: '',
  reference_image_url: '',
}
