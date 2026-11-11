import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { BookingWizard } from './booking-wizard'

import type { BookingSearch } from './booking-wizard'
import type { BookingConfirmation } from '@/features/booking/api'

const SERVICE = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Gel Polish',
  description: null,
  category: 'gel_polish',
  price: 150000,
  duration_minutes: 90,
  image_url: null,
  is_active: true,
}
const START_AT = '2026-11-12T10:00:00+07:00'

function slots() {
  return HttpResponse.json({
    data: {
      date: '2026-11-12',
      service_id: SERVICE.id,
      slots: [
        { start_at: START_AT, end_at: '2026-11-12T11:30:00+07:00', available_artist_ids: ['a'] },
        {
          start_at: '2026-11-12T13:00:00+07:00',
          end_at: '2026-11-12T14:30:00+07:00',
          available_artist_ids: ['a'],
        },
      ],
    },
  })
}

function created() {
  return HttpResponse.json(
    {
      data: {
        id: '33333333-3333-4333-8333-333333333333',
        booking_code: 'NP-20261112-A7K2',
        status: 'pending',
        service: SERVICE,
        artist: { id: 'a', name: 'Owner', photo_url: null, is_active: true },
        start_at: START_AT,
        end_at: '2026-11-12T11:30:00+07:00',
        total_price: 150000,
      },
    },
    { status: 201 },
  )
}

function Harness({
  initial,
  onBooked,
}: {
  initial: BookingSearch
  onBooked: (c: BookingConfirmation) => void
}) {
  const [search, setSearch] = useState<BookingSearch>(initial)
  return (
    <BookingWizard
      search={search}
      onSearchChange={setSearch}
      services={{
        services: [SERVICE],
        isPending: false,
        error: null,
        onRetry: () => undefined,
      }}
      onBooked={onBooked}
      onCancel={() => undefined}
    />
  )
}

async function fillGuestAndReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '10.00' }))
  await user.click(screen.getByRole('button', { name: 'Lanjut' }))
  await user.type(await screen.findByLabelText('Nama'), 'Siti Rahayu')
  await user.type(screen.getByLabelText('Nomor HP'), '0812-3456-7890')
  await user.click(screen.getByRole('button', { name: 'Lanjut' }))
  expect(await screen.findByRole('heading', { name: 'Tinjau dan kirim' })).toBeInTheDocument()
}

const AT_SLOTS: BookingSearch = { layanan: SERVICE.id, tanggal: '2026-11-12' }

describe('BookingWizard', () => {
  it('starts at the service list when nothing is chosen', async () => {
    await renderWithRouter(<Harness initial={{}} onBooked={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Pilih layanan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gel Polish/ })).toBeInTheDocument()
  })

  it('books a slot and sends it back exactly as the API returned it', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.get(`${API}/availability`, slots),
      http.post(`${API}/bookings`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return created()
      }),
    )
    const onBooked = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={AT_SLOTS} onBooked={onBooked} />)

    await fillGuestAndReview(user)
    expect(screen.getByText('+62 812-3456-7890')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Kirim pemesanan' }))

    await waitFor(() => expect(onBooked).toHaveBeenCalled())
    expect(body).toMatchObject({
      service_id: SERVICE.id,
      start_at: START_AT,
      customer_name: 'Siti Rahayu',
      customer_phone: '+6281234567890',
    })
    expect(body).not.toHaveProperty('artist_id')
    expect(onBooked.mock.calls[0]?.[0]).toMatchObject({ booking_code: 'NP-20261112-A7K2' })
  })

  it('does not advance without a slot or with an invalid phone number', async () => {
    server.use(http.get(`${API}/availability`, slots))
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={AT_SLOTS} onBooked={vi.fn()} />)

    await screen.findByRole('button', { name: '10.00' })
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '10.00' }))
    await user.click(screen.getByRole('button', { name: 'Lanjut' }))
    await user.type(await screen.findByLabelText('Nama'), 'Siti')
    await user.type(screen.getByLabelText('Nomor HP'), '021555')
    await user.click(screen.getByRole('button', { name: 'Lanjut' }))

    expect(await screen.findByText(/Nomor HP tidak valid/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Isi data Anda' })).toBeInTheDocument()
  })

  it('returns to slot selection on 409 and keeps what the customer typed', async () => {
    server.use(
      http.get(`${API}/availability`, slots),
      http.post(`${API}/bookings`, () =>
        HttpResponse.json({ error: { code: 'SLOT_UNAVAILABLE', message: 'x' } }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={AT_SLOTS} onBooked={vi.fn()} />)

    await fillGuestAndReview(user)
    await user.click(screen.getByRole('button', { name: 'Kirim pemesanan' }))

    expect(await screen.findByText(/Jadwal tersebut baru saja terisi/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pilih tanggal dan jam' })).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: '13.00' }))
    await user.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(await screen.findByLabelText('Nama')).toHaveValue('Siti Rahayu')
  })

  it('shows server validation on the matching field (422)', async () => {
    server.use(
      http.get(`${API}/availability`, slots),
      http.post(`${API}/bookings`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'x',
              details: [{ field: 'customer_phone', message: 'Nomor tidak dikenali server' }],
            },
          },
          { status: 422 },
        ),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={AT_SLOTS} onBooked={vi.fn()} />)

    await fillGuestAndReview(user)
    await user.click(screen.getByRole('button', { name: 'Kirim pemesanan' }))

    expect(await screen.findByText('Nomor tidak dikenali server')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Isi data Anda' })).toBeInTheDocument()
  })

  it('shows a countdown and disables sending on 429', async () => {
    server.use(
      http.get(`${API}/availability`, slots),
      http.post(`${API}/bookings`, () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'x' } },
          {
            status: 429,
            // Browsers only expose this cross-origin header when the API lists it (the real one does).
            headers: { 'Retry-After': '30', 'Access-Control-Expose-Headers': 'Retry-After' },
          },
        ),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={AT_SLOTS} onBooked={vi.fn()} />)

    await fillGuestAndReview(user)
    await user.click(screen.getByRole('button', { name: 'Kirim pemesanan' }))

    expect(await screen.findByText(/Coba lagi dalam 30 detik/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kirim pemesanan' })).toBeDisabled()
  })

  it('tells the customer when a date has no free slots', async () => {
    server.use(
      http.get(`${API}/availability`, () =>
        HttpResponse.json({ data: { date: '2026-11-12', service_id: SERVICE.id, slots: [] } }),
      ),
    )
    await renderWithRouter(<Harness initial={AT_SLOTS} onBooked={vi.fn()} />)
    expect(
      await screen.findByText('Tidak ada jadwal tersedia pada tanggal ini, coba tanggal lain.'),
    ).toBeInTheDocument()
  })
})
