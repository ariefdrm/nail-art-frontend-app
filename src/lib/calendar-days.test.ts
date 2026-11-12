import { describe, expect, it } from 'vitest'

import {
  addMonths,
  daysBetween,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  monthGrid,
  startOfMonth,
  startOfWeek,
  weekdayIndex,
  weekDays,
} from './calendar-days'

describe('calendar-days', () => {
  it('starts weeks on Monday', () => {
    // 2026-11-10 is a Tuesday.
    expect(weekdayIndex('2026-11-10')).toBe(1)
    expect(startOfWeek('2026-11-10')).toBe('2026-11-09')
    expect(endOfWeek('2026-11-10')).toBe('2026-11-15')
    // Sunday belongs to the week that began the Monday before.
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09')
    expect(weekdayIndex('2026-11-15')).toBe(6)
  })

  it('lists seven days across a month and a year end', () => {
    expect(weekDays('2026-12-31')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ])
  })

  it('finds month edges, including leap years', () => {
    expect(startOfMonth('2026-11-18')).toBe('2026-11-01')
    expect(endOfMonth('2026-11-18')).toBe('2026-11-30')
    expect(endOfMonth('2028-02-10')).toBe('2028-02-29')
    expect(endOfMonth('2026-02-10')).toBe('2026-02-28')
  })

  it('moves by months without overflowing short months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-11-15', 1)).toBe('2026-12-15')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('builds a month grid of whole Monday-first weeks', () => {
    const grid = monthGrid('2026-11-10')
    expect(grid[0]?.[0]).toBe('2026-10-26')
    expect(grid.at(-1)?.[6]).toBe('2026-12-06')
    expect(grid.every((week) => week.length === 7)).toBe(true)
    expect(isSameMonth('2026-11-01', '2026-11-30')).toBe(true)
    expect(isSameMonth('2026-10-31', '2026-11-01')).toBe(false)
  })

  it('counts whole days between two days', () => {
    expect(daysBetween('2026-11-10', '2026-11-10')).toBe(0)
    expect(daysBetween('2026-11-10', '2026-11-17')).toBe(7)
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1)
    expect(daysBetween('2026-11-17', '2026-11-10')).toBe(-7)
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365)
  })
})
