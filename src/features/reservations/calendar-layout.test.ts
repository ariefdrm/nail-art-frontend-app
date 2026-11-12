import { describe, expect, it } from 'vitest'

import { makeBooking } from '@/test/fixtures'

import { gridHours, layoutDay } from './calendar-layout'

function at(start: string, end: string, id: string) {
  return makeBooking({
    id,
    start_at: `2026-11-10T${start}:00+07:00`,
    end_at: `2026-11-10T${end}:00+07:00`,
  })
}

describe('layoutDay', () => {
  it('gives a lone booking the whole width', () => {
    const [placed] = layoutDay([at('10:00', '11:30', 'a')])
    expect(placed).toMatchObject({ startMin: 600, endMin: 690, lane: 0, lanes: 1 })
  })

  it('keeps back-to-back bookings in one lane', () => {
    const placed = layoutDay([at('10:00', '11:00', 'a'), at('11:00', '12:00', 'b')])
    expect(placed.map((p) => [p.lane, p.lanes])).toEqual([
      [0, 1],
      [0, 1],
    ])
  })

  it('puts overlapping bookings side by side with equal widths', () => {
    const placed = layoutDay([
      at('10:00', '12:00', 'a'),
      at('10:30', '11:30', 'b'),
      at('11:00', '11:45', 'c'),
    ])
    expect(placed.map((p) => p.lane)).toEqual([0, 1, 2])
    expect(placed.every((p) => p.lanes === 3)).toBe(true)
  })

  it('reuses a free lane and does not widen unrelated bookings', () => {
    const placed = layoutDay([
      at('09:00', '10:00', 'a'),
      at('09:30', '10:30', 'b'),
      at('10:00', '11:00', 'c'),
      at('13:00', '14:00', 'd'),
    ])
    const byId = Object.fromEntries(placed.map((p) => [p.booking.id, p]))
    expect(byId.c).toMatchObject({ lane: 0, lanes: 2 })
    expect(byId.d).toMatchObject({ lane: 0, lanes: 1 })
  })

  it('draws a very short booking at a readable height', () => {
    const [placed] = layoutDay([at('10:00', '10:10', 'a')])
    expect(placed?.endMin).toBe(630)
  })
})

describe('gridHours', () => {
  it('shows 08.00 to 20.00 by default', () => {
    expect(gridHours([])).toEqual({ firstHour: 8, lastHour: 20 })
  })

  it('stretches to hold early and late bookings', () => {
    const placed = layoutDay([at('06:30', '07:30', 'a'), at('20:30', '21:15', 'b')])
    expect(gridHours(placed)).toEqual({ firstHour: 6, lastHour: 22 })
  })
})
