import { describe, expect, it } from 'vitest'

import { toListParams, defaultRange, hasActiveFilters, isBlankSearch } from './search'
import { availableTransitions, canReschedule, requiresStarted } from './transitions'

describe('availableTransitions', () => {
  it('offers only what the backend accepts', () => {
    expect(availableTransitions('pending')).toEqual(['confirmed', 'cancelled'])
    expect(availableTransitions('confirmed')).toEqual(['completed', 'no_show', 'cancelled'])
  })

  it.each(['completed', 'cancelled', 'no_show'] as const)('has no way out of %s', (status) => {
    expect(availableTransitions(status)).toEqual([])
    expect(canReschedule(status)).toBe(false)
  })

  it('knows which moves need the booking to have started', () => {
    expect(requiresStarted('completed')).toBe(true)
    expect(requiresStarted('no_show')).toBe(true)
    expect(requiresStarted('confirmed')).toBe(false)
    expect(requiresStarted('cancelled')).toBe(false)
  })
})

describe('reservation search', () => {
  it('starts on today plus a week', () => {
    const range = defaultRange()
    expect(range.dari && range.sampai && range.dari < range.sampai).toBe(true)
  })

  it('tells a blank URL from a filtered one, and a selection from a filter', () => {
    expect(isBlankSearch({})).toBe(true)
    expect(isBlankSearch({ status: 'pending' })).toBe(false)
    expect(hasActiveFilters({ id: 'x', halaman: 2 })).toBe(false)
    expect(hasActiveFilters({ q: 'siti' })).toBe(true)
  })

  it('maps URL names to API params and drops a blank query', () => {
    expect(toListParams({ q: '  ', dari: '2026-11-10', status: 'pending', halaman: 3 })).toEqual({
      date_from: '2026-11-10',
      date_to: undefined,
      status: 'pending',
      artist_id: undefined,
      q: undefined,
      page: 3,
      per_page: 20,
    })
  })
})
