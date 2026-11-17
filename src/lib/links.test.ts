import { describe, expect, it } from 'vitest'

import { isHttpUrl, isWhatsAppUrl } from './links'

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

describe('isHttpUrl', () => {
  it('accepts http and https URLs only', () => {
    expect(isHttpUrl('https://example.com/a.jpg')).toBe(true)
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isHttpUrl('//example.com')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
  })
})
