import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { Inbox } from './inbox'

function note(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    type: 'new_booking',
    title: 'Reservasi baru',
    body: 'Siti memesan Gel Polish (NP-20261112-A7K2).',
    booking_id: '66666666-6666-4666-8666-666666666666',
    created_at: new Date(Date.now() - 2 * 60_000).toISOString(),
    read: false,
    read_at: null,
    ...over,
  }
}

function serveList(
  data: object[],
  meta: Partial<Record<string, number>> = {},
  seen: URLSearchParams[] = [],
) {
  server.use(
    http.get(`${API}/admin/notifications`, ({ request }) => {
      seen.push(new URL(request.url).searchParams)
      return HttpResponse.json({
        data,
        meta: { page: 1, per_page: 20, total: data.length, total_pages: 1, ...meta },
      })
    }),
  )
  return seen
}

async function render(search = {}, onSearchChange = vi.fn()) {
  await renderWithRouter(
    <>
      <Inbox search={search} onSearchChange={onSearchChange} />
      <Toaster />
    </>,
  )
  return onSearchChange
}

describe('Inbox', () => {
  it('lists notifications, newest first, marking the unread ones in text and shape', async () => {
    serveList([
      note('n1'),
      note('n2', {
        type: 'booking_cancelled',
        title: 'Reservasi dibatalkan',
        read: true,
        booking_id: null,
      }),
    ])
    await render()

    expect(await screen.findByText('Reservasi baru')).toBeInTheDocument()
    expect(screen.getByText('Reservasi dibatalkan')).toBeInTheDocument()
    expect(screen.getAllByText('Belum dibaca')).toHaveLength(1)
    expect(screen.getAllByText('2 menit yang lalu').length).toBeGreaterThan(0)
  })

  it('links a notification to its reservation and marks it read when opened', async () => {
    serveList([note('n1')])
    const read: string[] = []
    server.use(
      http.patch(`${API}/admin/notifications/n1/read`, () => {
        read.push('n1')
        return HttpResponse.json({ data: note('n1', { read: true }) })
      }),
    )
    const user = userEvent.setup()
    await render()

    const link = await screen.findByRole('link', { name: /Reservasi baru/ })
    expect(link.getAttribute('href')).toContain('id=66666666-6666-4666-8666-666666666666')
    await user.click(link)

    await waitFor(() => expect(read).toEqual(['n1']))
  })

  it('does not call the API for one that is already read', async () => {
    serveList([note('n1', { read: true })])
    const read: string[] = []
    server.use(
      http.patch(`${API}/admin/notifications/n1/read`, () => {
        read.push('n1')
        return HttpResponse.json({ data: note('n1') })
      }),
    )
    const user = userEvent.setup()
    await render()

    await user.click(await screen.findByRole('link', { name: /Reservasi baru/ }))

    expect(read).toEqual([])
  })

  it('lets one without a reservation be marked read by pressing it', async () => {
    serveList([
      note('n3', {
        booking_id: null,
        type: 'upcoming_reminder',
        title: 'Reservasi segera dimulai',
      }),
    ])
    const read: string[] = []
    server.use(
      http.patch(`${API}/admin/notifications/n3/read`, () => {
        read.push('n3')
        return HttpResponse.json({ data: note('n3', { read: true }) })
      }),
    )
    const user = userEvent.setup()
    await render()

    await user.click(await screen.findByRole('button', { name: /Reservasi segera dimulai/ }))

    await waitFor(() => expect(read).toEqual(['n3']))
  })

  it('marks everything read and says how many', async () => {
    serveList([note('n1'), note('n2')])
    server.use(
      http.get(`${API}/admin/notifications/unread-count`, () =>
        HttpResponse.json({ data: { unread: 2 } }),
      ),
      http.post(`${API}/admin/notifications/read-all`, () =>
        HttpResponse.json({ data: { marked: 2 } }),
      ),
    )
    const user = userEvent.setup()
    await render()

    const button = screen.getByRole('button', { name: 'Tandai semua dibaca' })
    await waitFor(() => expect(button).toBeEnabled())
    await user.click(button)

    expect(await screen.findByText('2 notifikasi ditandai sudah dibaca')).toBeInTheDocument()
  })

  it('has nothing to mark when nothing is unread', async () => {
    serveList([note('n1', { read: true })])
    await render()
    expect(await screen.findByRole('button', { name: 'Tandai semua dibaca' })).toBeDisabled()
  })

  it('asks only for unread ones when the filter is on, and explains an empty inbox', async () => {
    const seen = serveList([])
    await render({ belum: true })

    expect(await screen.findByText('Semua notifikasi sudah dibaca')).toBeInTheDocument()
    expect(seen[0]?.get('unread')).toBe('true')
  })

  it('says the inbox covers the last 30 days when it is empty', async () => {
    serveList([])
    await render()
    expect(
      await screen.findByText('Notifikasi dari 30 hari terakhir akan muncul di sini.'),
    ).toBeInTheDocument()
  })

  it('toggles the unread filter and pages through results', async () => {
    serveList([note('n1')], { page: 2, total: 45, total_pages: 3 })
    const user = userEvent.setup()
    const onSearchChange = await render({ halaman: 2 })

    expect(await screen.findByText('Menampilkan 21 - 21 dari 45')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Berikutnya' }))
    expect(onSearchChange).toHaveBeenLastCalledWith({ halaman: 3 })

    await user.click(screen.getByRole('switch', { name: 'Hanya yang belum dibaca' }))
    expect(onSearchChange).toHaveBeenLastCalledWith({ belum: true, halaman: undefined })
  })

  it('shows an error with a retry that recovers', async () => {
    let fail = true
    server.use(
      http.get(`${API}/admin/notifications`, () =>
        fail
          ? HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
          : HttpResponse.json({
              data: [note('n1')],
              meta: { page: 1, per_page: 20, total: 1, total_pages: 1 },
            }),
      ),
    )
    const user = userEvent.setup()
    await render()

    expect(await screen.findByText(/kesalahan pada server/)).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('Reservasi baru')).toBeInTheDocument()
  })
})
