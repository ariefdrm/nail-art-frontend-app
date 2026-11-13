import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { UNREAD_POLL_MS } from '@/features/notifications/queries'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { NotificationBell } from './notification-bell'

function serveUnread(count: number) {
  server.use(
    http.get(`${API}/admin/notifications/unread-count`, () =>
      HttpResponse.json({ data: { unread: count } }),
    ),
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('NotificationBell', () => {
  it('is a plain link to the inbox when nothing is unread', async () => {
    serveUnread(0)
    await renderWithRouter(<NotificationBell />)

    const link = await screen.findByRole('link', { name: 'Notifikasi' })
    expect(link.getAttribute('href')).toBe('/admin/notifikasi')
  })

  it('announces how many are unread', async () => {
    serveUnread(3)
    await renderWithRouter(<NotificationBell />)

    expect(
      await screen.findByRole('link', { name: 'Notifikasi, 3 belum dibaca' }),
    ).toBeInTheDocument()
  })

  it('caps a very large count so the badge stays small', async () => {
    serveUnread(250)
    await renderWithRouter(<NotificationBell />)
    await waitFor(() => expect(screen.getByText('99+')).toBeInTheDocument())
  })

  it('asks again every 30 seconds while the tab is visible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let asked = 0
    server.use(
      http.get(`${API}/admin/notifications/unread-count`, () => {
        asked += 1
        return HttpResponse.json({ data: { unread: asked } })
      }),
    )
    await renderWithRouter(<NotificationBell />)

    await screen.findByRole('link', { name: 'Notifikasi, 1 belum dibaca' })
    await vi.advanceTimersByTimeAsync(UNREAD_POLL_MS + 500)

    expect(
      await screen.findByRole('link', { name: 'Notifikasi, 2 belum dibaca' }),
    ).toBeInTheDocument()
    expect(asked).toBe(2)
  })
})
