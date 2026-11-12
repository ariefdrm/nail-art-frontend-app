import { describe, expect, it } from 'vitest'

import {
  blockFormSchema,
  dayHoursSchema,
  parseHoursField,
  toBlockInput,
  toBusinessHours,
  toHoursFormValues,
  toWibInstant,
} from './schemas'

const OPEN = {
  day_of_week: 1,
  is_open: true,
  open_time: '09:00',
  close_time: '17:00',
  break_start: '12:00',
  break_end: '13:00',
}

function messages(day: object): string[] {
  return dayHoursSchema.safeParse(day).error?.issues.map((issue) => issue.message) ?? []
}

describe('dayHoursSchema', () => {
  it('accepts a normal day, with or without a break', () => {
    expect(messages(OPEN)).toEqual([])
    expect(messages({ ...OPEN, break_start: '', break_end: '' })).toEqual([])
  })

  it('ignores the times of a closed day', () => {
    expect(messages({ ...OPEN, is_open: false, open_time: '25:99' })).toEqual([])
  })

  it('needs opening and closing times, closing after opening', () => {
    expect(messages({ ...OPEN, open_time: '' })).toContain('Jam buka wajib diisi')
    expect(messages({ ...OPEN, close_time: '' })).toContain('Jam tutup wajib diisi')
    expect(messages({ ...OPEN, open_time: '17:00', close_time: '09:00' })).toContain(
      'Jam tutup harus setelah jam buka',
    )
    expect(messages({ ...OPEN, close_time: '09:00' })).toContain('Jam tutup harus setelah jam buka')
  })

  it('wants the break as a pair', () => {
    expect(messages({ ...OPEN, break_end: '' })).toContain(
      'Isi mulai dan selesai istirahat, atau kosongkan keduanya',
    )
    expect(messages({ ...OPEN, break_start: '' })).toContain(
      'Isi mulai dan selesai istirahat, atau kosongkan keduanya',
    )
  })

  it('keeps the break inside opening hours and in order', () => {
    expect(messages({ ...OPEN, break_start: '08:00' })).toContain(
      'Istirahat harus berada di dalam jam buka',
    )
    expect(messages({ ...OPEN, break_end: '18:00' })).toContain(
      'Istirahat harus berada di dalam jam buka',
    )
    expect(messages({ ...OPEN, break_start: '13:00', break_end: '12:00' })).toContain(
      'Selesai istirahat harus setelah mulai',
    )
  })
})

describe('business hours conversion', () => {
  const rows = [
    { day_of_week: 0, is_open: false },
    {
      day_of_week: 1,
      is_open: true,
      open_time: '09:00:00',
      close_time: '17:00:00',
      break_start: '12:00',
      break_end: '13:00',
    },
    {
      day_of_week: 2,
      is_open: true,
      open_time: '10:00',
      close_time: '16:00',
      break_start: null,
      break_end: null,
    },
  ]

  it('fills all seven days, cuts seconds and treats missing rows as closed', () => {
    const { days } = toHoursFormValues(rows)
    expect(days).toHaveLength(7)
    expect(days.map((day) => day.day_of_week)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(days[1]).toMatchObject({ is_open: true, open_time: '09:00', close_time: '17:00' })
    expect(days[2]).toMatchObject({ break_start: '', break_end: '' })
    expect(days[5]).toMatchObject({ is_open: false, open_time: '' })
  })

  it('sends exactly seven days; closed ones without times, breaks only when paired', () => {
    const body = toBusinessHours(toHoursFormValues(rows))
    expect(body).toHaveLength(7)
    expect(body[0]).toEqual({ day_of_week: 0, is_open: false })
    expect(body[1]).toEqual({
      day_of_week: 1,
      is_open: true,
      open_time: '09:00',
      close_time: '17:00',
      break_start: '12:00',
      break_end: '13:00',
    })
    expect(body[2]).toEqual({
      day_of_week: 2,
      is_open: true,
      open_time: '10:00',
      close_time: '16:00',
    })
  })
})

describe('parseHoursField', () => {
  it('reads both path styles and ignores anything else', () => {
    expect(parseHoursField('hours.2.open_time')).toEqual({ day: 2, field: 'open_time' })
    expect(parseHoursField('hours[6].break_end')).toEqual({ day: 6, field: 'break_end' })
    expect(parseHoursField('hours.9.open_time')).toBeNull()
    expect(parseHoursField('hours')).toBeNull()
    expect(parseHoursField('customer_name')).toBeNull()
  })
})

describe('blockFormSchema', () => {
  const VALID = {
    scope: '',
    start_date: '2026-12-24',
    start_time: '09:00',
    end_date: '2026-12-26',
    end_time: '17:00',
    reason: 'Libur Natal',
  }

  function problems(block: object): string[] {
    return blockFormSchema.safeParse(block).error?.issues.map((issue) => issue.message) ?? []
  }

  it('accepts a normal block', () => {
    expect(problems(VALID)).toEqual([])
  })

  it('needs the end to be after the start', () => {
    expect(problems({ ...VALID, end_date: '2026-12-24', end_time: '09:00' })).toContain(
      'Selesai harus setelah mulai',
    )
    expect(problems({ ...VALID, end_date: '2026-12-23' })).toContain('Selesai harus setelah mulai')
  })

  it('allows at most 366 days', () => {
    expect(
      problems({ ...VALID, start_date: '2026-01-01', end_date: '2027-01-02', end_time: '09:00' }),
    ).toEqual([])
    expect(problems({ ...VALID, start_date: '2026-01-01', end_date: '2027-01-03' })).toContain(
      'Rentang blokir maksimal 366 hari',
    )
  })

  it('limits the reason to 255 letters', () => {
    expect(problems({ ...VALID, reason: 'x'.repeat(256) })).toContain('Alasan maksimal 255 huruf')
  })

  it('builds WIB instants and treats an empty scope as the whole studio', () => {
    expect(toWibInstant('2026-12-24', '09:00')).toBe('2026-12-24T09:00:00+07:00')
    expect(toBlockInput(VALID)).toEqual({
      start_at: '2026-12-24T09:00:00+07:00',
      end_at: '2026-12-26T17:00:00+07:00',
      artist_id: undefined,
      reason: 'Libur Natal',
    })
    expect(toBlockInput({ ...VALID, scope: 'a1', reason: '' })).toMatchObject({
      artist_id: 'a1',
      reason: undefined,
    })
  })
})
