import { describe, expect, it } from 'vitest'

import { pickNextSlots } from './next-slots'

const slot = (start: string) => ({ start_at: start, end_at: start, available_artist_ids: [] })

describe('pickNextSlots', () => {
  it('skips days without slots and returns the first day that has some', () => {
    const result = pickNextSlots([
      { day: '2099-01-01', slots: [] },
      { day: '2099-01-02', slots: undefined },
      { day: '2099-01-03', slots: [slot('2099-01-03T10:00:00+07:00')] },
    ])
    expect(result?.day).toBe('2099-01-03')
  })

  it('drops slots that already started', () => {
    const result = pickNextSlots([
      {
        day: '2000-01-01',
        slots: [slot('2000-01-01T10:00:00+07:00')],
      },
      { day: '2099-01-02', slots: [slot('2099-01-02T09:00:00+07:00')] },
    ])
    expect(result?.day).toBe('2099-01-02')
  })

  it('returns null when nothing is open', () => {
    expect(pickNextSlots([{ day: '2099-01-01', slots: [] }])).toBeNull()
  })
})
