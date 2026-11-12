import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { makeBooking } from '@/test/fixtures'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { ReservationCalendar } from './reservation-calendar'

import type { ReservationSearch } from '@/features/reservations/search'

const WEEK: ReservationSearch = { tampilan: 'kalender', tanggal: '2026-11-12' }

function at(id: string, name: string, start: string, end: string, extra = {}) {
  return makeBooking({
    id,
    customer_name: name,
    start_at: `2026-11-${start}:00+07:00`,
    end_at: `2026-11-${end}:00+07:00`,
    ...extra,
  })
}

function serve(bookings: ReturnType<typeof makeBooking>[], seen: URLSearchParams[] = []) {
  server.use(
    http.get(`${API}/admin/bookings`, ({ request }) => {
      seen.push(new URL(request.url).searchParams)
      return HttpResponse.json({
        data: bookings,
        meta: { page: 1, per_page: 100, total: bookings.length, total_pages: 1 },
      })
    }),
  )
  return seen
}

describe('ReservationCalendar, week', () => {
  it('loads Monday to Sunday of the chosen week and labels it', async () => {
    const seen = serve([])
    await renderWithRouter(<ReservationCalendar search={WEEK} onSearchChange={vi.fn()} />)

    expect(await screen.findByText('9 - 15 November 2026')).toBeInTheDocument()
    expect(seen[0]?.get('date_from')).toBe('2026-11-09')
    expect(seen[0]?.get('date_to')).toBe('2026-11-15')
    expect(await screen.findByText('Tidak ada reservasi pada minggu ini.')).toBeInTheDocument()
  })

  it('puts each reservation on its day with time, customer, service and status', async () => {
    serve([
      at('a', 'Siti Rahayu', '10T10:00', '10T11:30'),
      at('b', 'Budi Santoso', '12T13:00', '12T14:00', { status: 'confirmed' }),
    ])
    await renderWithRouter(<ReservationCalendar search={WEEK} onSearchChange={vi.fn()} />)

    const tuesday = await screen.findByRole('list', { name: 'Selasa, 10 November 2026' })
    expect(
      within(tuesday).getByRole('link', {
        name: '10.00 sampai 11.30, Siti Rahayu, Gel Polish, Menunggu konfirmasi',
      }),
    ).toBeInTheDocument()
    const thursday = screen.getByRole('list', { name: 'Kamis, 12 November 2026' })
    expect(
      within(thursday).getByRole('link', { name: /Budi Santoso.*Terkonfirmasi/ }),
    ).toBeInTheDocument()
  })

  it('opens the detail panel by linking to the reservation id, keeping the view', async () => {
    serve([at('66666666-6666-4666-8666-666666666666', 'Siti Rahayu', '10T10:00', '10T11:00')])
    await renderWithRouter(<ReservationCalendar search={WEEK} onSearchChange={vi.fn()} />)

    const link = await screen.findByRole('link', { name: /Siti Rahayu/ })
    expect(link.getAttribute('href')).toContain('id=66666666-6666-4666-8666-666666666666')
    expect(link.getAttribute('href')).toContain('tampilan=kalender')
  })

  it('shows overlapping reservations side by side instead of hiding one', async () => {
    serve([
      at('a', 'Siti Rahayu', '10T10:00', '10T11:30'),
      at('b', 'Dewi Lestari', '10T10:30', '10T12:00'),
    ])
    await renderWithRouter(<ReservationCalendar search={WEEK} onSearchChange={vi.fn()} />)

    const tuesday = await screen.findByRole('list', { name: 'Selasa, 10 November 2026' })
    expect(within(tuesday).getAllByRole('link')).toHaveLength(2)
  })

  it('passes the status, artist and search filters on to the API', async () => {
    const seen = serve([])
    await renderWithRouter(
      <ReservationCalendar
        search={{
          ...WEEK,
          status: 'pending',
          q: ' siti ',
          artist: '55555555-5555-4555-8555-555555555555',
        }}
        onSearchChange={vi.fn()}
      />,
    )

    await screen.findByText('9 - 15 November 2026')
    expect(seen[0]?.get('status')).toBe('pending')
    expect(seen[0]?.get('q')).toBe('siti')
    expect(seen[0]?.get('artist_id')).toBe('55555555-5555-4555-8555-555555555555')
  })

  it('moves a week at a time and back to today, closing any open panel', async () => {
    serve([])
    const onSearchChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(
      <ReservationCalendar search={{ ...WEEK, id: 'x' }} onSearchChange={onSearchChange} />,
    )

    await user.click(await screen.findByRole('button', { name: 'Minggu berikutnya' }))
    expect(onSearchChange).toHaveBeenLastCalledWith({
      ...WEEK,
      id: undefined,
      tanggal: '2026-11-19',
    })

    await user.click(screen.getByRole('button', { name: 'Minggu sebelumnya' }))
    expect(onSearchChange).toHaveBeenLastCalledWith({
      ...WEEK,
      id: undefined,
      tanggal: '2026-11-05',
    })

    await user.click(screen.getByRole('button', { name: 'Hari ini' }))
    expect(onSearchChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ tampilan: 'kalender', id: undefined }),
    )
  })

  it('switches to the month while staying on the same date', async () => {
    serve([])
    const onSearchChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(<ReservationCalendar search={WEEK} onSearchChange={onSearchChange} />)

    await user.click(await screen.findByRole('button', { name: 'Bulan' }))
    expect(onSearchChange).toHaveBeenCalledWith({ ...WEEK, skala: 'bulan', tanggal: '2026-11-12' })
  })

  it('shows an error with a retry that recovers', async () => {
    let fail = true
    server.use(
      http.get(`${API}/admin/bookings`, () =>
        fail
          ? HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
          : HttpResponse.json({
              data: [],
              meta: { page: 1, per_page: 100, total: 0, total_pages: 0 },
            }),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<ReservationCalendar search={WEEK} onSearchChange={vi.fn()} />)

    expect(await screen.findByText(/kesalahan pada server/)).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('Tidak ada reservasi pada minggu ini.')).toBeInTheDocument()
  })

  it('follows the pagination so a busy week is never cut off', async () => {
    const pages: string[] = []
    server.use(
      http.get(`${API}/admin/bookings`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        pages.push(String(page))
        return HttpResponse.json({
          data: [at(`id-${page}`, `Pelanggan ${page}`, '10T10:00', '10T11:00')],
          meta: { page, per_page: 100, total: 2, total_pages: 2 },
        })
      }),
    )
    await renderWithRouter(<ReservationCalendar search={WEEK} onSearchChange={vi.fn()} />)

    expect(await screen.findByRole('link', { name: /Pelanggan 2/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pelanggan 1/ })).toBeInTheDocument()
    expect(pages).toEqual(['1', '2'])
  })
})

describe('ReservationCalendar, month', () => {
  const MONTH: ReservationSearch = { tampilan: 'kalender', skala: 'bulan', tanggal: '2026-11-12' }

  it('loads the whole month grid including spill-over days', async () => {
    const seen = serve([])
    await renderWithRouter(<ReservationCalendar search={MONTH} onSearchChange={vi.fn()} />)

    expect(await screen.findByText('November 2026')).toBeInTheDocument()
    expect(seen[0]?.get('date_from')).toBe('2026-10-26')
    expect(seen[0]?.get('date_to')).toBe('2026-12-06')
  })

  it('counts reservations per day, lists a few and offers the rest', async () => {
    serve(
      ['09', '10', '11', '12'].map((hour, index) =>
        at(`m-${index}`, `Pelanggan ${index + 1}`, `10T${hour}:00`, `10T${hour}:45`),
      ),
    )
    await renderWithRouter(<ReservationCalendar search={MONTH} onSearchChange={vi.fn()} />)

    const day = await screen.findByRole('link', {
      name: 'Selasa, 10 November 2026, 4 reservasi. Buka minggunya',
    })
    expect(day.getAttribute('href')).toContain('skala=minggu')
    expect(day.getAttribute('href')).toContain('tanggal=2026-11-10')
    expect(screen.getAllByRole('link', { name: /Pelanggan/ })).toHaveLength(3)
    expect(screen.getByRole('link', { name: '+1 lagi' })).toBeInTheDocument()
  })

  it('moves a month at a time', async () => {
    serve([])
    const onSearchChange = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(<ReservationCalendar search={MONTH} onSearchChange={onSearchChange} />)

    await user.click(await screen.findByRole('button', { name: 'Bulan berikutnya' }))
    expect(onSearchChange).toHaveBeenCalledWith({ ...MONTH, id: undefined, tanggal: '2026-12-12' })
  })
})
