import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { makeBooking } from '@/test/fixtures'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { ReservationList } from './reservation-list'

function page(bookings: ReturnType<typeof makeBooking>[], meta = {}) {
  return HttpResponse.json({
    data: bookings,
    meta: { page: 1, per_page: 20, total: bookings.length, total_pages: 1, ...meta },
  })
}

describe('ReservationList', () => {
  it('lists reservations with time, customer, service, status and price', async () => {
    server.use(
      http.get(`${API}/admin/bookings`, () =>
        page([
          makeBooking(),
          makeBooking({
            id: '77777777-7777-4777-8777-777777777777',
            customer_name: 'Budi Santoso',
            status: 'confirmed',
            source: 'admin',
            schedule_conflict: true,
          }),
        ]),
      ),
    )
    await renderWithRouter(<ReservationList search={{}} onSearchChange={vi.fn()} />)

    expect(await screen.findByText('Siti Rahayu')).toBeInTheDocument()
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('Menunggu konfirmasi')).toBeInTheDocument()
    expect(screen.getByText('Terkonfirmasi')).toBeInTheDocument()
    expect(screen.getByText('Bentrok jadwal')).toBeInTheDocument()
    expect(screen.getAllByText('Rp150.000')).toHaveLength(2)
    expect(screen.getByText('Menampilkan 1 - 2 dari 2')).toBeInTheDocument()
  })

  it('sends the URL filters to the API', async () => {
    let query = new URLSearchParams()
    server.use(
      http.get(`${API}/admin/bookings`, ({ request }) => {
        query = new URL(request.url).searchParams
        return page([makeBooking()])
      }),
    )
    await renderWithRouter(
      <ReservationList
        search={{
          status: 'pending',
          dari: '2026-11-10',
          sampai: '2026-11-17',
          q: 'siti',
          halaman: 2,
        }}
        onSearchChange={vi.fn()}
      />,
    )

    await screen.findByText('Siti Rahayu')
    expect(Object.fromEntries(query)).toEqual({
      status: 'pending',
      date_from: '2026-11-10',
      date_to: '2026-11-17',
      q: 'siti',
      page: '2',
      per_page: '20',
    })
  })

  it('explains an empty result and clears the filters', async () => {
    server.use(http.get(`${API}/admin/bookings`, () => page([])))
    const onSearchChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(
      <ReservationList search={{ status: 'pending' }} onSearchChange={onSearchChange} />,
    )

    expect(await screen.findByText('Belum ada reservasi pada rentang ini.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hapus filter' }))
    expect(onSearchChange).toHaveBeenCalledWith({ halaman: 1 })
  })

  it('pages through results', async () => {
    server.use(
      http.get(`${API}/admin/bookings`, () =>
        page([makeBooking()], { page: 2, per_page: 20, total: 45, total_pages: 3 }),
      ),
    )
    const onSearchChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(
      <ReservationList search={{ halaman: 2 }} onSearchChange={onSearchChange} />,
    )

    expect(await screen.findByText('Menampilkan 21 - 21 dari 45')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Berikutnya' }))
    expect(onSearchChange).toHaveBeenCalledWith({ halaman: 3 })
    await user.click(screen.getByRole('button', { name: 'Sebelumnya' }))
    expect(onSearchChange).toHaveBeenCalledWith({ halaman: 1 })
  })

  it('shows an error with a retry that recovers', async () => {
    let fail = true
    server.use(
      http.get(`${API}/admin/bookings`, () =>
        fail
          ? HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
          : page([makeBooking()]),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<ReservationList search={{}} onSearchChange={vi.fn()} />)

    expect(await screen.findByText(/kesalahan pada server/)).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('Siti Rahayu')).toBeInTheDocument()
  })
})
