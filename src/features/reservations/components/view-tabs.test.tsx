import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithRouter } from '@/test/render-with-router'

import { ViewTabs } from './view-tabs'

describe('ViewTabs', () => {
  it('shows which view is on', async () => {
    await renderWithRouter(<ViewTabs search={{}} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Daftar' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Kalender' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('opens the calendar on the date the list was showing and drops the list range', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(
      <ViewTabs
        search={{ dari: '2026-11-10', sampai: '2026-11-17', status: 'pending', halaman: 3 }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Kalender' }))

    expect(onChange).toHaveBeenCalledWith({
      status: 'pending',
      tampilan: 'kalender',
      tanggal: '2026-11-10',
      dari: undefined,
      sampai: undefined,
      halaman: undefined,
    })
  })

  it('returns to the list with a sensible date range, keeping the filters', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(
      <ViewTabs
        search={{ tampilan: 'kalender', skala: 'bulan', tanggal: '2026-11-12', status: 'pending' }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Daftar' }))

    const next = onChange.mock.lastCall?.[0] as Record<string, unknown>
    expect(next).toMatchObject({
      status: 'pending',
      tampilan: undefined,
      skala: undefined,
      tanggal: undefined,
    })
    expect(next.dari).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(next.sampai).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does nothing when the current view is chosen again', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(<ViewTabs search={{}} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
