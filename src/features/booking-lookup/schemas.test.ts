import { describe, expect, it } from 'vitest'

import { lookupSchema } from './schemas'

describe('lookupSchema', () => {
  it.each(['NP-20261110-A7K2', 'np-20261110-a7k2', '  NP-20261110-A7K2  '])(
    'accepts %s',
    (code) => {
      expect(lookupSchema.safeParse({ booking_code: code, phone: '081234567890' }).success).toBe(
        true,
      )
    },
  )

  it.each(['', 'A7K2', 'NP-2026-A7K2', 'NP-20261110-A7K23'])('rejects the code "%s"', (code) => {
    expect(lookupSchema.safeParse({ booking_code: code, phone: '081234567890' }).success).toBe(
      false,
    )
  })

  it('asks for a valid Indonesian mobile number', () => {
    const result = lookupSchema.safeParse({ booking_code: 'NP-20261110-A7K2', phone: '021555' })
    expect(result.error?.issues[0]?.message).toBe('Nomor HP tidak valid. Contoh: 0812 3456 7890')
  })
})
