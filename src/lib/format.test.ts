import { describe, expect, it } from 'vitest'

import {
  addDaysWib,
  formatDate,
  formatPhone,
  formatRupiah,
  formatTime,
  maxBookingDateWib,
  normalizePhone,
  toWibDateString,
} from './format'

describe('format', () => {
  it('formats rupiah without decimals or spaces', () => {
    expect(formatRupiah(150000)).toBe('Rp150.000')
  })

  it('formats dates and times in WIB', () => {
    expect(formatDate('2026-11-10T10:00:00+07:00')).toBe('Selasa, 10 November 2026')
    expect(formatTime('2026-11-10T10:00:00+07:00')).toBe('10.00')
  })

  it('uses the WIB day even when the UTC day is different', () => {
    expect(toWibDateString('2026-11-10T20:00:00Z')).toBe('2026-11-11')
    expect(formatTime('2026-11-10T20:00:00Z')).toBe('03.00')
  })

  it('adds calendar days across month ends', () => {
    expect(addDaysWib('2026-11-30', 1)).toBe('2026-12-01')
    expect(maxBookingDateWib() > toWibDateString(new Date())).toBe(true)
  })

  it.each(['0812-3456-7890', '6281234567890', '+62 812 3456 7890'])('normalizes %s', (input) => {
    expect(normalizePhone(input)).toBe('+6281234567890')
  })

  it('rejects numbers that are not Indonesian mobiles', () => {
    expect(normalizePhone('021123456')).toBeNull()
    expect(normalizePhone('abc')).toBeNull()
  })

  it('shows the normalized number grouped', () => {
    expect(formatPhone('081234567890')).toBe('+62 812-3456-7890')
    expect(formatPhone('bukan nomor')).toBe('bukan nomor')
  })
})
