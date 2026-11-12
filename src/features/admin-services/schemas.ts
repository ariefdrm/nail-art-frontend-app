import { z } from 'zod'

import type { Service, ServiceInput } from '@/lib/api/types'

export const MAX_PRICE = 100_000_000
export const DURATIONS = Array.from({ length: 32 }, (_, index) => (index + 1) * 15)

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** "Gel Polish" -> "gel_polish": the form the API stores and the catalog filters by. */
export function toCategorySlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// Numbers are typed into text boxes, so the form holds strings and converts on submit.
export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(120, 'Nama maksimal 120 huruf'),
  category: z
    .string()
    .trim()
    .min(1, 'Kategori wajib diisi')
    .refine((value) => toCategorySlug(value).length > 0, 'Kategori harus berisi huruf atau angka')
    .refine((value) => toCategorySlug(value).length <= 50, 'Kategori maksimal 50 huruf'),
  description: z.string().trim().max(1000, 'Deskripsi maksimal 1000 huruf'),
  price: z
    .string()
    .trim()
    .min(1, 'Harga wajib diisi')
    .regex(/^\d+$/, 'Harga harus berupa angka bulat, tanpa titik atau koma')
    .refine((value) => Number(value) <= MAX_PRICE, 'Harga maksimal Rp100.000.000'),
  duration_minutes: z.string().refine((value) => {
    const minutes = Number(value)
    return Number.isInteger(minutes) && minutes >= 15 && minutes <= 480 && minutes % 15 === 0
  }, 'Durasi harus kelipatan 15 menit, antara 15 dan 480'),
  image_url: z
    .string()
    .trim()
    .max(2048, 'Tautan terlalu panjang')
    .refine(
      (value) => value === '' || isHttpUrl(value),
      'Tautan harus diawali http:// atau https://',
    ),
  is_active: z.boolean(),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>

export const EMPTY_SERVICE: ServiceFormValues = {
  name: '',
  category: '',
  description: '',
  price: '',
  duration_minutes: '60',
  image_url: '',
  is_active: true,
}

/** Field names the API can report on this form (they match the form's own). */
export const SERVICE_FIELDS = [
  'name',
  'category',
  'description',
  'price',
  'duration_minutes',
  'image_url',
  'is_active',
] as const

export function toFormValues(service: Service): ServiceFormValues {
  return {
    name: service.name,
    category: service.category,
    description: service.description ?? '',
    price: String(service.price),
    duration_minutes: String(service.duration_minutes),
    image_url: service.image_url ?? '',
    is_active: service.is_active,
  }
}

/**
 * Form -> request body. On edit the whole record is sent (PUT), so a cleared description or image
 * must be sent as empty / null to actually clear it; on create, empty optional fields are left out.
 */
export function toServiceInput(values: ServiceFormValues, mode: 'create' | 'edit'): ServiceInput {
  const description = values.description.trim()
  const imageUrl = values.image_url.trim()
  return {
    name: values.name.trim(),
    category: toCategorySlug(values.category),
    price: Number(values.price),
    duration_minutes: Number(values.duration_minutes),
    is_active: values.is_active,
    ...(mode === 'edit' || description ? { description } : {}),
    ...(imageUrl ? { image_url: imageUrl } : mode === 'edit' ? { image_url: null } : {}),
  }
}
