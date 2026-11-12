import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
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

function signInAs(role: 'owner' | 'staff') {
  server.use(
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json({
        data: { access_token: 'a1', refresh_token: 'r', token_type: 'Bearer', expires_in: 900 },
      }),
    ),
    http.get(`${API}/auth/me`, () =>
      HttpResponse.json({
        data: { id: '44444444-4444-4444-8444-444444444444', name: 'Siti', email: 'o@x.test', role },
      }),
    ),
    http.get(`${API}/admin/dashboard/summary`, () =>
      HttpResponse.json({
        data: {
          total_bookings: 0,
          by_status: {},
          no_show_rate: null,
          online_booking_ratio: null,
          revenue_completed: 0,
          avg_confirmation_minutes: null,
        },
      }),
    ),
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
}

describe('owner-only export', () => {
  it('is in the menu and usable for the owner', async () => {
    signInAs('owner')
    await open('/admin/ekspor')

    expect(await screen.findByRole('button', { name: 'Unduh CSV' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ekspor' }).length).toBeGreaterThan(0)
  })

  it('is hidden from the menu for staff, and a direct visit explains why', async () => {
    signInAs('staff')
    await open('/admin/ekspor')

    expect(await screen.findByText('Anda tidak memiliki akses')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Unduh CSV' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ekspor' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reservasi' })).toBeInTheDocument()
  })

  it('opens the dashboard for staff as well', async () => {
    signInAs('staff')
    await open('/admin')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })
})
