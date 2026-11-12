import { describe, expect, it } from 'vitest'

import { EMPTY_GUEST, guestSchema } from './guest-schema'

const VALID = { ...EMPTY_GUEST, customer_name: 'Siti Rahayu', customer_phone: '0812-3456-7890' }

describe('guestSchema', () => {
  it('accepts a name and any Indonesian mobile format', () => {
    for (const phone of ['08123456789', '628123456789', '+62 812 3456 789']) {
      expect(guestSchema.safeParse({ ...VALID, customer_phone: phone }).success).toBe(true)
    }
  })

  it('requires a name and a valid phone, with Indonesian messages', () => {
    const result = guestSchema.safeParse({ ...EMPTY_GUEST, customer_phone: '021 555' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map((issue) => issue.message)
    expect(messages).toContain('Nama wajib diisi')
    expect(messages).toContain('Nomor HP tidak valid. Contoh: 0812 3456 7890')
  })

  it('limits the note and accepts only http(s) reference links', () => {
    expect(guestSchema.safeParse({ ...VALID, customer_note: 'x'.repeat(501) }).success).toBe(false)
    expect(guestSchema.safeParse({ ...VALID, reference_image_url: 'ftp://x.test/a' }).success).toBe(
      false,
    )
    expect(
      guestSchema.safeParse({ ...VALID, reference_image_url: 'https://x.test/a.jpg' }).success,
    ).toBe(true)
  })
})
