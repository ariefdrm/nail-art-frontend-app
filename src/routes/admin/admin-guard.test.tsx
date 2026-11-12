import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

const ME = {
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Siti Rahayu',
  email: 'o@x.test',
  role: 'owner',
}

const refreshOk = http.post(`${API}/auth/refresh`, () =>
  HttpResponse.json({
    data: { access_token: 'a1', refresh_token: 'r', token_type: 'Bearer', expires_in: 900 },
  }),
)
const meOk = http.get(`${API}/auth/me`, () => HttpResponse.json({ data: ME }))

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

describe('admin route guard', () => {
  it('sends a visitor without a session to the login page, remembering where they went', async () => {
    const router = await open('/admin/reservasi')
    // No handler registered: a visitor who never signed in must not even call the API.
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin/login')
  })

  it('resumes the session from the cookie and shows the dashboard', async () => {
    server.use(refreshOk, meOk)
    setSessionHint()
    await open('/admin')
    expect(await screen.findByRole('heading', { name: 'Halo, Siti Rahayu' })).toBeInTheDocument()
  })

  it('returns to login when the cookie is no longer valid', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, { status: 401 }),
      ),
    )
    setSessionHint()
    await open('/admin')
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
  })

  it('reports a forbidden origin as a configuration problem, not a login', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Origin' } }, { status: 403 }),
      ),
    )
    setSessionHint()
    await open('/admin')
    expect(await screen.findByText(/CORS_ORIGINS/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Masuk' })).not.toBeInTheDocument()
  })

  it('skips the login form for someone already signed in', async () => {
    server.use(refreshOk, meOk)
    setSessionHint()
    await open('/admin/login')
    expect(await screen.findByRole('heading', { name: 'Halo, Siti Rahayu' })).toBeInTheDocument()
  })

  it('logs out from the top bar and clears the session', async () => {
    let loggedOut = false
    server.use(
      refreshOk,
      meOk,
      http.post(`${API}/auth/logout`, () => {
        loggedOut = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    setSessionHint()
    const user = userEvent.setup()
    await open('/admin')

    await user.click(await screen.findByRole('button', { name: 'Keluar' }))

    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(loggedOut).toBe(true)
    expect(localStorage.getItem('np.session')).toBeNull()
  })

  it('opens the reservation list on today plus a week, then keeps what the URL says', async () => {
    server.use(
      refreshOk,
      meOk,
      http.get(`${API}/admin/bookings`, () =>
        HttpResponse.json({ data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } }),
      ),
      http.get(`${API}/artists`, () => HttpResponse.json({ data: [] })),
    )
    setSessionHint()
    const router = await open('/admin/reservasi')

    expect(await screen.findByRole('heading', { name: 'Reservasi' })).toBeInTheDocument()
    expect(router.state.location.search).toMatchObject({
      dari: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      sampai: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })
  })

  it('does not force a date range when a filter is already in the URL', async () => {
    server.use(
      refreshOk,
      meOk,
      http.get(`${API}/admin/bookings`, () =>
        HttpResponse.json({ data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } }),
      ),
      http.get(`${API}/artists`, () => HttpResponse.json({ data: [] })),
    )
    setSessionHint()
    const router = await open('/admin/reservasi?status=pending')

    expect(await screen.findByRole('heading', { name: 'Reservasi' })).toBeInTheDocument()
    expect(router.state.location.search).toEqual({ status: 'pending' })
  })

  it('opens the calendar view straight from the URL without forcing a list range', async () => {
    server.use(
      refreshOk,
      meOk,
      http.get(`${API}/admin/bookings`, () =>
        HttpResponse.json({ data: [], meta: { page: 1, per_page: 100, total: 0, total_pages: 0 } }),
      ),
      http.get(`${API}/artists`, () => HttpResponse.json({ data: [] })),
    )
    setSessionHint()
    const router = await open('/admin/reservasi?tampilan=kalender')

    expect(await screen.findByRole('button', { name: 'Minggu berikutnya' })).toBeInTheDocument()
    expect(router.state.location.search).toEqual({ tampilan: 'kalender' })
  })

  it('opens the new reservation panel from the URL and from its button', async () => {
    server.use(
      refreshOk,
      meOk,
      http.get(`${API}/admin/bookings`, () =>
        HttpResponse.json({ data: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 } }),
      ),
      http.get(`${API}/artists`, () => HttpResponse.json({ data: [] })),
      http.get(`${API}/services`, () => HttpResponse.json({ data: [] })),
    )
    setSessionHint()
    const router = await open('/admin/reservasi?status=pending')

    // fireEvent: user-event's pointer simulation spins on this page in the test DOM.
    fireEvent.click(await screen.findByRole('button', { name: /Reservasi baru/ }))

    expect(await screen.findByText(/langsung berstatus terkonfirmasi/)).toBeInTheDocument()
    expect(router.state.location.search).toMatchObject({ baru: true, status: 'pending' })
  })

  it.each([
    ['/admin/layanan', 'Layanan', '/admin/services'],
    ['/admin/artist', 'Artist', '/admin/artists'],
  ])('serves the %s admin page behind the guard', async (url, heading, endpoint) => {
    server.use(
      refreshOk,
      meOk,
      http.get(`${API}${endpoint}`, () => HttpResponse.json({ data: [] })),
    )
    setSessionHint()
    await open(url)
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })
})
