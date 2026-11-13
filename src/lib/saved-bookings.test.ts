import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listSavedBookings, MAX_SAVED, removeSavedBooking, saveBooking } from './saved-bookings'

const booking = (code: string) => ({
  code,
  service_name: 'Gel Polish',
  start_at: '2026-11-12T10:00:00+07:00',
})

beforeEach(() => localStorage.clear())

describe('saved bookings', () => {
  it('keeps the newest first and drops duplicate codes', () => {
    saveBooking(booking('NP-1'))
    saveBooking(booking('NP-2'))
    saveBooking(booking('NP-1'))
    expect(listSavedBookings().map((item) => item.code)).toEqual(['NP-1', 'NP-2'])
  })

  it('keeps at most five codes', () => {
    for (let index = 0; index < MAX_SAVED + 3; index += 1) saveBooking(booking(`NP-${index}`))
    expect(listSavedBookings()).toHaveLength(MAX_SAVED)
    expect(listSavedBookings()[0]?.code).toBe(`NP-${MAX_SAVED + 2}`)
  })

  it('removes one code', () => {
    saveBooking(booking('NP-1'))
    saveBooking(booking('NP-2'))
    expect(removeSavedBooking('NP-1').map((item) => item.code)).toEqual(['NP-2'])
  })

  it('never stores a phone number', () => {
    saveBooking({ ...booking('NP-1'), phone: '+6281234567890' } as ReturnType<typeof booking>)
    expect(JSON.stringify(listSavedBookings())).not.toContain('62812')
  })

  it('treats corrupt data as empty', () => {
    localStorage.setItem('np.bookings', '{not json')
    expect(listSavedBookings()).toEqual([])
    localStorage.setItem('np.bookings', JSON.stringify([{ code: 1 }]))
    expect(listSavedBookings()).toEqual([])
  })

  it('does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(listSavedBookings()).toEqual([])
    vi.restoreAllMocks()
  })
})
