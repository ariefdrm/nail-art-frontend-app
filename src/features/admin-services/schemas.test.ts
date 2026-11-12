import { describe, expect, it } from 'vitest'

import { SERVICE } from '@/test/fixtures'

import {
  DURATIONS,
  EMPTY_SERVICE,
  serviceFormSchema,
  toCategorySlug,
  toFormValues,
  toServiceInput,
} from './schemas'

const VALID = { ...EMPTY_SERVICE, name: 'Gel Polish', category: 'Gel Polish', price: '150000' }

describe('toCategorySlug', () => {
  it('turns a label into the stored slug', () => {
    expect(toCategorySlug('Gel Polish')).toBe('gel_polish')
    expect(toCategorySlug('  Nail   Art!! ')).toBe('nail_art')
    expect(toCategorySlug('gel_polish')).toBe('gel_polish')
    expect(toCategorySlug('???')).toBe('')
  })
})

describe('serviceFormSchema', () => {
  it('accepts a normal service', () => {
    expect(serviceFormSchema.safeParse(VALID).success).toBe(true)
  })

  it('asks for what is missing, in Indonesian', () => {
    const result = serviceFormSchema.safeParse({ ...EMPTY_SERVICE })
    const messages = result.error?.issues.map((issue) => issue.message)
    expect(messages).toContain('Nama wajib diisi')
    expect(messages).toContain('Kategori wajib diisi')
    expect(messages).toContain('Harga wajib diisi')
  })

  it.each(['150.000', '1,5', '-5', 'abc', '100000001'])('rejects the price "%s"', (price) => {
    expect(serviceFormSchema.safeParse({ ...VALID, price }).success).toBe(false)
  })

  it('accepts a free service and the maximum price', () => {
    expect(serviceFormSchema.safeParse({ ...VALID, price: '0' }).success).toBe(true)
    expect(serviceFormSchema.safeParse({ ...VALID, price: '100000000' }).success).toBe(true)
  })

  it.each(['10', '20', '500', '0', 'x'])('rejects the duration "%s"', (duration_minutes) => {
    expect(serviceFormSchema.safeParse({ ...VALID, duration_minutes }).success).toBe(false)
  })

  it('offers only durations the API accepts', () => {
    expect(DURATIONS[0]).toBe(15)
    expect(DURATIONS.at(-1)).toBe(480)
    expect(DURATIONS.every((minutes) => minutes % 15 === 0)).toBe(true)
  })

  it('accepts only http(s) image links', () => {
    expect(
      serviceFormSchema.safeParse({ ...VALID, image_url: 'https://x.test/a.jpg' }).success,
    ).toBe(true)
    expect(
      serviceFormSchema.safeParse({ ...VALID, image_url: 'javascript:alert(1)' }).success,
    ).toBe(false)
  })
})

describe('toServiceInput', () => {
  it('leaves empty optional fields out on create', () => {
    expect(toServiceInput(VALID, 'create')).toEqual({
      name: 'Gel Polish',
      category: 'gel_polish',
      price: 150000,
      duration_minutes: 60,
      is_active: true,
    })
  })

  it('sends cleared optional fields as empty / null on edit so they really clear', () => {
    expect(toServiceInput(VALID, 'edit')).toMatchObject({ description: '', image_url: null })
  })

  it('round-trips a stored service', () => {
    const input = toServiceInput(toFormValues({ ...SERVICE, description: 'Tahan lama' }), 'edit')
    expect(input).toMatchObject({
      name: 'Gel Polish',
      category: 'gel_polish',
      price: 150000,
      duration_minutes: 90,
      description: 'Tahan lama',
    })
  })
})
