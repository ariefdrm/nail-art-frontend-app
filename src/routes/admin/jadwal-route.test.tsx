import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { RouteError } from '@/components/common/route-error'
import { setSessionHint } from '@/lib/auth/token-store'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'
import { API, server } from '@/test/server'

// The root route mounts dev-only devtools, which cannot unmount cleanly in a test DOM.
vi.mock('@tanstack/react-devtools', () => ({ TanStackDevtools: () => null }))
vi.mock('@tanstack/react-router-devtools', () => ({ TanStackRouterDevtoolsPanel: () => null }))

// Kept apart from the other guard tests: an open side panel from a neighbouring test leaves the
// shared test DOM in a state that stalls this one.

const WEEK = [
  { day_of_week: 0, is_open: false },
  ...[1, 2, 3, 4, 5, 6].map((day_of_week) => ({
    day_of_week,
    is_open: true,
    open_time: '09:00',
    close_time: '17:00',
    break_start: null,
    break_end: null,
  })),
]

function serveAdmin() {
  server.use(
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json({
        data: { access_token: 'a1', refresh_token: 'r', token_type: 'Bearer', expires_in: 900 },
      }),
    ),
    http.get(`${API}/auth/me`, () =>
      HttpResponse.json({
        data: {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Siti',
          email: 'o@x.test',
          role: 'owner',
        },
      }),
    ),
    http.get(`${API}/admin/business-hours`, () => HttpResponse.json({ data: WEEK })),
    http.get(`${API}/admin/blocked-slots`, () => HttpResponse.json({ data: [] })),
    http.get(`${API}/artists`, () => HttpResponse.json({ data: [] })),
  )
  setSessionHint()
}

async function open(url: string) {
  const queryClient = createQueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [url] }),
    defaultErrorComponent: RouteError,
  })
  await router.load()
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('/admin/jadwal', () => {
  it('opens on the business hours and can switch to blocked time', async () => {
    serveAdmin()
    const router = await open('/admin/jadwal')

    expect(await screen.findByLabelText('Senin: jam buka')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Blokir waktu' }))

    await waitFor(() => expect(router.state.location.search).toEqual({ tab: 'blokir' }))
    expect(await screen.findByText('Belum ada waktu yang diblokir')).toBeInTheDocument()
  })

  it('warns before leaving with unsaved hours, and lets go on request', async () => {
    serveAdmin()
    const router = await open('/admin/jadwal')

    fireEvent.change(await screen.findByLabelText('Senin: jam tutup'), {
      target: { value: '18:00' },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Blokir waktu' }))

    expect(await screen.findByText('Perubahan belum disimpan')).toBeInTheDocument()
    expect(router.state.location.search).toEqual({})

    fireEvent.click(screen.getByRole('button', { name: 'Buang perubahan' }))

    await waitFor(() => expect(router.state.location.search).toEqual({ tab: 'blokir' }))
  })
})
