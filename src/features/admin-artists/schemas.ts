import { z } from 'zod'

import type { Artist, ArtistInput } from '@/lib/api/types'

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export const artistFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(80, 'Nama maksimal 80 huruf'),
  photo_url: z
    .string()
    .trim()
    .max(2048, 'Tautan terlalu panjang')
    .refine(
      (value) => value === '' || isHttpUrl(value),
      'Tautan harus diawali http:// atau https://',
    ),
  is_active: z.boolean(),
})

export type ArtistFormValues = z.infer<typeof artistFormSchema>

export const EMPTY_ARTIST: ArtistFormValues = { name: '', photo_url: '', is_active: true }

export const ARTIST_FIELDS = ['name', 'photo_url', 'is_active'] as const

export function toFormValues(artist: Artist): ArtistFormValues {
  return { name: artist.name, photo_url: artist.photo_url ?? '', is_active: artist.is_active }
}

/** On edit the whole record is sent, so a cleared photo goes as null to really clear it. */
export function toArtistInput(values: ArtistFormValues, mode: 'create' | 'edit'): ArtistInput {
  const photo = values.photo_url.trim()
  return {
    name: values.name.trim(),
    is_active: values.is_active,
    ...(photo ? { photo_url: photo } : mode === 'edit' ? { photo_url: null } : {}),
  }
}
