import { describe, expect, it } from 'vitest'

import { activePreset, presetRange, rangeProblem } from './ranges'

const TODAY = '2026-11-12'

describe('presetRange', () => {
  it('counts the last N days up to today', () => {
    expect(presetRange('7-hari', TODAY)).toEqual({ dari: '2026-11-06', sampai: TODAY })
    expect(presetRange('30-hari', TODAY)).toEqual({ dari: '2026-10-14', sampai: TODAY })
  })

  it('takes whole calendar months', () => {
    expect(presetRange('bulan-ini', TODAY)).toEqual({ dari: '2026-11-01', sampai: '2026-11-30' })
    expect(presetRange('bulan-lalu', TODAY)).toEqual({ dari: '2026-10-01', sampai: '2026-10-31' })
  })

  it('steps back over a year end', () => {
    expect(presetRange('bulan-lalu', '2027-01-15')).toEqual({
      dari: '2026-12-01',
      sampai: '2026-12-31',
    })
  })
})

describe('activePreset', () => {
  it('recognises a preset by its dates', () => {
    expect(activePreset(presetRange('30-hari', TODAY), TODAY)).toBe('30-hari')
    expect(activePreset(presetRange('bulan-lalu', TODAY), TODAY)).toBe('bulan-lalu')
  })

  it('calls anything else custom', () => {
    expect(activePreset({ dari: '2026-11-01', sampai: '2026-11-03' }, TODAY)).toBe('kustom')
  })
})

describe('rangeProblem', () => {
  it('accepts an ordinary range and one of exactly 366 days', () => {
    expect(rangeProblem({ dari: '2026-11-01', sampai: '2026-11-30' })).toBeNull()
    expect(rangeProblem({ dari: '2026-01-01', sampai: '2027-01-01' })).toBeNull()
  })

  it('refuses a reversed range and one over 366 days', () => {
    expect(rangeProblem({ dari: '2026-11-10', sampai: '2026-11-09' })).toMatch(/sebelum/)
    expect(rangeProblem({ dari: '2026-01-01', sampai: '2027-01-02' })).toMatch(/maksimal 366 hari/)
  })
})
