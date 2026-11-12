import { describe, expect, it } from 'vitest'

import {
  addDaysWib,
  formatCategory,
  formatDayKey,
  formatDayRange,
  formatMonthYear,
  formatWeekdayShort,
  minutesOfDayWib,
  formatDuration,
  formatDate,
  formatPhone,
  formatRupiah,
  formatTime,
  maxBookingDateWib,
  normalizePhone,
  parseDay,
  toDayKey,
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

  it('formats durations in Indonesian', () => {
    expect(formatDuration(90)).toBe('1 j 30 mnt')
    expect(formatDuration(120)).toBe('2 j')
    expect(formatDuration(45)).toBe('45 mnt')
  })

  it('turns category slugs into labels', () => {
    expect(formatCategory('gel_polish')).toBe('Gel polish')
  })

  it('round-trips calendar days', () => {
    expect(toDayKey(parseDay('2026-11-09'))).toBe('2026-11-09')
    expect(toDayKey(parseDay('2026-01-05'))).toBe('2026-01-05')
  })

  it('labels plain days without any timezone drift', () => {
    expect(formatDayKey('2026-11-10')).toBe('Selasa, 10 November 2026')
    expect(formatMonthYear('2026-11-10')).toBe('November 2026')
    expect(formatWeekdayShort('2026-11-10')).toBe('Sel')
  })

  it('writes week ranges across months and years', () => {
    expect(formatDayRange('2026-11-09', '2026-11-15')).toBe('9 - 15 November 2026')
    expect(formatDayRange('2026-11-30', '2026-12-06')).toBe('30 Nov - 6 Des 2026')
    expect(formatDayRange('2026-12-28', '2027-01-03')).toBe('28 Des 2026 - 3 Jan 2027')
  })

  it('reads the WIB minute of day', () => {
    expect(minutesOfDayWib('2026-11-10T10:30:00+07:00')).toBe(630)
    expect(minutesOfDayWib('2026-11-10T20:00:00Z')).toBe(180)
  })
})
