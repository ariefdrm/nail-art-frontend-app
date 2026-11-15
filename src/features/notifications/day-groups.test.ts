import { describe, expect, it } from 'vitest'

import { groupByDay } from './day-groups'

import type { Notification } from '@/lib/api/types'

const at = (id: string, createdAt: string) => ({ id, created_at: createdAt }) as Notification

describe('groupByDay', () => {
  it('groups by WIB day and names today and yesterday', () => {
    const groups = groupByDay(
      [
        at('a', '2026-11-12T14:00:00+07:00'),
        at('b', '2026-11-12T09:00:00+07:00'),
        at('c', '2026-11-11T20:00:00+07:00'),
        at('d', '2026-11-05T10:00:00+07:00'),
      ],
      '2026-11-12',
    )
    expect(groups.map((group) => group.label)).toEqual([
      'Hari ini',
      'Kemarin',
      'Kamis, 5 November 2026',
    ])
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('uses the Jakarta day, not UTC, near midnight', () => {
    // 23:30 WIB on the 12th is 16:30 UTC; 00:30 WIB on the 13th is still the 12th in UTC.
    const groups = groupByDay(
      [at('a', '2026-11-13T00:30:00+07:00'), at('b', '2026-11-12T23:30:00+07:00')],
      '2026-11-13',
    )
    expect(groups.map((group) => group.label)).toEqual(['Hari ini', 'Kemarin'])
  })

  it('returns nothing for an empty list', () => {
    expect(groupByDay([], '2026-11-12')).toEqual([])
  })
})
