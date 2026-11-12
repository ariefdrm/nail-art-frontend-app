import { describe, expect, it, vi } from 'vitest'

import { filenameFromDisposition, saveBlob } from './download'

describe('filenameFromDisposition', () => {
  it('reads quoted and plain names', () => {
    expect(
      filenameFromDisposition('attachment; filename="bookings_2026-03-01_2026-03-31.csv"'),
    ).toBe('bookings_2026-03-01_2026-03-31.csv')
    expect(filenameFromDisposition('attachment; filename=data.csv')).toBe('data.csv')
    expect(filenameFromDisposition("attachment; filename*=UTF-8''laporan%20maret.csv")).toBe(
      'laporan maret.csv',
    )
  })

  it('returns null when there is nothing to read', () => {
    expect(filenameFromDisposition(null)).toBeNull()
    expect(filenameFromDisposition('')).toBeNull()
    expect(filenameFromDisposition('inline')).toBeNull()
  })
})

describe('saveBlob', () => {
  it('clicks a temporary download link and cleans up', () => {
    const create = vi.fn(() => 'blob:fake')
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.useFakeTimers()

    saveBlob(new Blob(['a,b']), 'x.csv')

    expect(create).toHaveBeenCalled()
    expect(click).toHaveBeenCalledOnce()
    expect(document.querySelector('a[download]')).toBeNull()
    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:fake')
    vi.useRealTimers()
    click.mockRestore()
  })
})
