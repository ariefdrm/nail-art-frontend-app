import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { addDaysWib, todayWib } from '@/lib/format'
import { renderWithRouter } from '@/test/render-with-router'

import { ReservationFilters } from './reservation-filters'

describe('ReservationFilters', () => {
  it('applies the quick ranges and the pending shortcut', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(
      <ReservationFilters search={{ halaman: 4 }} artists={[]} onChange={onChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Hari ini' }))
    expect(onChange).toHaveBeenLastCalledWith({ dari: todayWib(), sampai: todayWib(), halaman: 1 })

    await user.click(screen.getByRole('button', { name: 'Besok' }))
    expect(onChange).toHaveBeenLastCalledWith({
      dari: addDaysWib(todayWib(), 1),
      sampai: addDaysWib(todayWib(), 1),
      halaman: 1,
    })

    await user.click(screen.getByRole('button', { name: 'Menunggu konfirmasi' }))
    expect(onChange).toHaveBeenLastCalledWith({ status: 'pending', halaman: 1 })
  })

  it('marks the active shortcut', async () => {
    await renderWithRouter(
      <ReservationFilters search={{ status: 'pending' }} artists={[]} onChange={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Menunggu konfirmasi' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Hari ini' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('waits for typing to pause before searching, and resets to page 1', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(
      <ReservationFilters search={{ halaman: 3 }} artists={[]} onChange={onChange} />,
    )

    await user.type(screen.getByRole('searchbox', { name: 'Cari reservasi' }), 'siti')
    expect(onChange).not.toHaveBeenCalled()

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(onChange).toHaveBeenCalledWith({ q: 'siti', halaman: 1, id: undefined })
  })

  it('never lets the range end before it starts', async () => {
    const onChange = vi.fn()
    await renderWithRouter(
      <ReservationFilters
        search={{ dari: '2026-11-10', sampai: '2026-11-12' }}
        artists={[]}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('Dari tanggal'), { target: { value: '2026-11-20' } })

    const last = onChange.mock.lastCall?.[0] as { dari?: string; sampai?: string }
    expect(last.dari).toBe('2026-11-20')
    expect(last.sampai).toBe('2026-11-20')
  })

  it('filters by status and artist, and offers to clear everything', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(
      <ReservationFilters
        search={{ status: 'pending' }}
        artists={[
          {
            id: '55555555-5555-4555-8555-555555555555',
            name: 'Owner',
            photo_url: null,
            is_active: true,
          },
        ]}
        onChange={onChange}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Status'), 'confirmed')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'confirmed' }))

    await user.selectOptions(screen.getByLabelText('Artist'), 'Owner')
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ artist: '55555555-5555-4555-8555-555555555555' }),
    )

    await user.click(screen.getByRole('button', { name: 'Hapus filter' }))
    expect(onChange).toHaveBeenLastCalledWith({ halaman: 1 })
  })
})
