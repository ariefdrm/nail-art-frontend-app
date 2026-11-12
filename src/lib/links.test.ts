import { describe, expect, it } from 'vitest'

import { isWhatsAppUrl } from './links'

describe('isWhatsAppUrl', () => {
  it('accepts wa.me links only', () => {
    expect(isWhatsAppUrl('https://wa.me/6281234567890?text=Halo')).toBe(true)
    expect(isWhatsAppUrl('javascript:alert(1)')).toBe(false)
    expect(isWhatsAppUrl('http://wa.me/6281234567890')).toBe(false)
    expect(isWhatsAppUrl('https://evil.test/wa.me/')).toBe(false)
    expect(isWhatsAppUrl(null)).toBe(false)
    expect(isWhatsAppUrl(undefined)).toBe(false)
  })
})
