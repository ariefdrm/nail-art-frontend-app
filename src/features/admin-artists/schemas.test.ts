import { describe, expect, it } from 'vitest'

import { ARTIST } from '@/test/fixtures'

import { EMPTY_ARTIST, artistFormSchema, toArtistInput, toFormValues } from './schemas'

describe('artistFormSchema', () => {
  it('needs a name of at most 80 letters', () => {
    expect(artistFormSchema.safeParse(EMPTY_ARTIST).error?.issues[0]?.message).toBe(
      'Nama wajib diisi',
    )
    expect(artistFormSchema.safeParse({ ...EMPTY_ARTIST, name: 'x'.repeat(81) }).success).toBe(
      false,
    )
    expect(artistFormSchema.safeParse({ ...EMPTY_ARTIST, name: 'Dewi' }).success).toBe(true)
  })

  it('accepts only http(s) photo links', () => {
    const base = { ...EMPTY_ARTIST, name: 'Dewi' }
    expect(artistFormSchema.safeParse({ ...base, photo_url: 'https://x.test/a.jpg' }).success).toBe(
      true,
    )
    expect(artistFormSchema.safeParse({ ...base, photo_url: 'ftp://x.test/a.jpg' }).success).toBe(
      false,
    )
  })
})

describe('toArtistInput', () => {
  it('leaves an empty photo out on create and clears it on edit', () => {
    const values = { ...EMPTY_ARTIST, name: ' Dewi ' }
    expect(toArtistInput(values, 'create')).toEqual({ name: 'Dewi', is_active: true })
    expect(toArtistInput(values, 'edit')).toEqual({
      name: 'Dewi',
      is_active: true,
      photo_url: null,
    })
  })

  it('round-trips a stored artist', () => {
    expect(toArtistInput(toFormValues(ARTIST), 'edit')).toEqual({
      name: 'Owner',
      is_active: true,
      photo_url: null,
    })
  })
})
