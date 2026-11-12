import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { makeBooking } from '@/test/fixtures'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { BookingLookup } from './booking-lookup'

import type { Booking } from '@/lib/api/types'

const CODE = 'NP-20261112-A7K2'
const NOT_FOUND = 'Reservasi tidak ditemukan. Periksa kode booking dan nomor HP Anda.'

function serveLookup(booking: Booking, seen: URL[] = []) {
  server.use(
    http.get(`${API}/bookings/${CODE}`, ({ request }) => {
      seen.push(new URL(request.url))
      return HttpResponse.json({ data: booking })
    }),
  )
  return seen
}

async function render() {
  await renderWithRouter(
    <>
      <BookingLookup />
      <Toaster />
    </>,
  )
}

async function search(
  user: ReturnType<typeof userEvent.setup>,
  code = CODE,
  phone = '0812-3456-7890',
) {
  await user.type(screen.getByLabelText('Kode booking'), code)
  await user.type(screen.getByLabelText('Nomor HP'), phone)
  await user.click(screen.getByRole('button', { name: 'Cari pesanan' }))
}

describe('BookingLookup', () => {
  it('finds a booking with an upper-cased code and a normalized phone number', async () => {
    const seen = serveLookup(makeBooking({ status: 'confirmed' }))
    const user = userEvent.setup()
    await render()

    await search(user, 'np-20261112-a7k2')

    expect(await screen.findByText('Terkonfirmasi')).toBeInTheDocument()
    expect(screen.getByText('Gel Polish')).toBeInTheDocument()
    expect(screen.getByText('Rp150.000')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(seen[0]?.searchParams.get('phone')).toBe('+6281234567890')
    expect(seen[0]?.pathname.endsWith(`/bookings/${CODE}`)).toBe(true)
  })

  it.each([
    ['404', 404, 'NOT_FOUND'],
    ['422', 422, 'VALIDATION_ERROR'],
  ])('answers a %s with the same single message', async (_name, status, code) => {
    server.use(
      http.get(`${API}/bookings/${CODE}`, () =>
        HttpResponse.json({ error: { code, message: 'rincian internal' } }, { status }),
      ),
    )
    const user = userEvent.setup()
    await render()

    await search(user)

    expect(await screen.findByText(NOT_FOUND)).toBeInTheDocument()
    expect(screen.queryByText('rincian internal')).not.toBeInTheDocument()
  })

  it('checks the format before asking the server', async () => {
    const user = userEvent.setup()
    await render()

    await search(user, 'ABC', '021555')

    expect(await screen.findByText(/Kode booking tidak sesuai/)).toBeInTheDocument()
    expect(screen.getByText(/Nomor HP tidak valid/)).toBeInTheDocument()
  })

  it('counts down on 429 and blocks searching until it ends', async () => {
    server.use(
      http.get(`${API}/bookings/${CODE}`, () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'x' } },
          { status: 429, headers: { 'Retry-After': '40' } },
        ),
      ),
    )
    const user = userEvent.setup()
    await render()

    await search(user)

    expect(await screen.findByText(/Coba lagi dalam 40 detik/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cari pesanan' })).toBeDisabled()
  })

  it('tells the customer when the studio changed their schedule', async () => {
    serveLookup(makeBooking({ schedule_conflict: true }))
    const user = userEvent.setup()
    await render()

    await search(user)

    expect(await screen.findByText(/Jadwal Anda terpengaruh/)).toBeInTheDocument()
  })

  it('cancels with an optional reason and shows the booking as cancelled', async () => {
    serveLookup(makeBooking({ status: 'pending' }))
    const bodies: unknown[] = []
    server.use(
      http.patch(`${API}/bookings/${CODE}/cancel`, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ data: makeBooking({ status: 'cancelled' }) })
      }),
    )
    const user = userEvent.setup()
    await render()

    await search(user)
    await user.click(await screen.findByRole('button', { name: 'Batalkan pemesanan' }))
    expect(await screen.findByText(`Batalkan reservasi ${CODE}?`)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Alasan (opsional)'), 'Berhalangan hadir')
    const confirm = screen.getAllByRole('button', { name: 'Batalkan pemesanan' }).at(-1)
    if (!confirm) throw new Error('confirm button missing')
    await user.click(confirm)

    await waitFor(() =>
      expect(bodies).toEqual([{ phone: '+6281234567890', reason: 'Berhalangan hadir' }]),
    )
    expect(await screen.findByText('Dibatalkan')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Batalkan pemesanan' })).not.toBeInTheDocument()
  })

  it('explains a refused cancellation in the API wording and shows the current state', async () => {
    serveLookup(makeBooking({ status: 'confirmed' }))
    server.use(
      http.patch(`${API}/bookings/${CODE}/cancel`, () =>
        HttpResponse.json(
          { error: { code: 'INVALID_STATUS_TRANSITION', message: 'Batas pembatalan telah lewat' } },
          { status: 409 },
        ),
      ),
    )
    const user = userEvent.setup()
    await render()

    await search(user)
    await user.click(await screen.findByRole('button', { name: 'Batalkan pemesanan' }))
    const confirm = screen.getAllByRole('button', { name: 'Batalkan pemesanan' }).at(-1)
    if (!confirm) throw new Error('confirm button missing')
    await user.click(confirm)

    expect(await screen.findByText('Batas pembatalan telah lewat')).toBeInTheDocument()
    expect(screen.getByText('Terkonfirmasi')).toBeInTheDocument()
  })

  it.each(['completed', 'cancelled', 'no_show'] as const)(
    'offers no cancel button for a %s booking',
    async (status) => {
      serveLookup(makeBooking({ status }))
      const user = userEvent.setup()
      await render()

      await search(user)

      await screen.findByText('Gel Polish')
      expect(screen.queryByRole('button', { name: 'Batalkan pemesanan' })).not.toBeInTheDocument()
    },
  )

  it('keeps the code and phone number out of web storage', async () => {
    serveLookup(makeBooking())
    const user = userEvent.setup()
    await render()

    await search(user)
    await screen.findByText('Gel Polish')

    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })
    expect(stored).not.toContain(CODE)
    expect(stored).not.toContain('81234567890')
  })
})
