import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { ARTIST, makeBooking, SERVICE } from '@/test/fixtures'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { ReservationDetailSheet } from './reservation-detail-sheet'

import type { Booking } from '@/lib/api/types'

const BOOKING = makeBooking()

function serve(booking: Booking) {
  server.use(
    http.get(`${API}/admin/bookings/${booking.id}`, () => HttpResponse.json({ data: booking })),
  )
}

/** Captures the JSON body of the next PATCH to `path`. */
function capturePatch(
  path: string,
  respond: () => Response = () => HttpResponse.json({ data: BOOKING }),
) {
  const calls: unknown[] = []
  server.use(
    http.patch(`${API}${path}`, async ({ request }) => {
      calls.push(await request.json())
      return respond()
    }),
  )
  return calls
}

async function open(booking: Booking, onClose = vi.fn()) {
  serve(booking)
  await renderWithRouter(
    <>
      <ReservationDetailSheet id={booking.id} onClose={onClose} />
      <Toaster />
    </>,
  )
  await screen.findByText(booking.customer_name)
  return onClose
}

describe('ReservationDetailSheet', () => {
  it('shows everything about the reservation and a WhatsApp link that opens safely', async () => {
    await open(makeBooking({ customer_note: 'Warna pink', admin_note: 'Pelanggan lama' }))

    expect(screen.getByText('NP-20261112-A7K2')).toBeInTheDocument()
    expect(screen.getByText('+62 812-3456-7890')).toBeInTheDocument()
    expect(screen.getByText('Rp150.000')).toBeInTheDocument()
    expect(screen.getByLabelText('Catatan pelanggan')).toHaveValue('Warna pink')
    expect(screen.getByLabelText('Catatan admin')).toHaveValue('Pelanggan lama')
    const link = screen.getByRole('link', { name: /Hubungi via WhatsApp/ })
    expect(link).toHaveAttribute('href', 'https://wa.me/6281234567890?text=Halo')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('refuses to link anything that is not a wa.me address', async () => {
    await open(makeBooking({ reminder_url: 'javascript:alert(1)' }))
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).not.toBeInTheDocument()
  })

  it('offers only the moves a pending reservation allows, and confirms it', async () => {
    const calls = capturePatch(`/admin/bookings/${BOOKING.id}/status`)
    const user = userEvent.setup()
    await open(BOOKING)

    expect(screen.getByRole('button', { name: 'Konfirmasi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Batalkan' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tandai selesai' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tidak hadir' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Konfirmasi' }))
    await waitFor(() => expect(calls).toEqual([{ status: 'confirmed' }]))
    expect(await screen.findByText('Reservasi dikonfirmasi')).toBeInTheDocument()
  })

  it('keeps Selesai and Tidak hadir disabled until the schedule starts', async () => {
    await open(makeBooking({ status: 'confirmed' }))

    expect(screen.getByRole('button', { name: 'Tandai selesai' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tidak hadir' })).toBeDisabled()
    expect(screen.getByText('Tersedia setelah jadwal dimulai.')).toBeInTheDocument()
  })

  it('enables them once the booking has started', async () => {
    const calls = capturePatch(`/admin/bookings/${BOOKING.id}/status`)
    const user = userEvent.setup()
    await open(
      makeBooking({
        status: 'confirmed',
        start_at: '2020-01-01T10:00:00+07:00',
        end_at: '2020-01-01T11:30:00+07:00',
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Tandai selesai' }))
    await waitFor(() => expect(calls).toEqual([{ status: 'completed' }]))
  })

  it.each(['completed', 'cancelled', 'no_show'] as const)(
    'gives a %s reservation no status buttons',
    async (status) => {
      await open(makeBooking({ status, cancel_reason: status === 'cancelled' ? 'Sakit' : null }))
      expect(screen.getByText(/sudah final/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Konfirmasi' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Jadwalkan ulang' })).not.toBeInTheDocument()
    },
  )

  it('needs a reason before cancelling, then sends it', async () => {
    const calls = capturePatch(`/admin/bookings/${BOOKING.id}/status`)
    const user = userEvent.setup()
    await open(BOOKING)

    await user.click(screen.getByRole('button', { name: 'Batalkan' }))
    expect(await screen.findByText(/Batalkan reservasi NP-20261112-A7K2\?/)).toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: 'Batalkan reservasi' })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByLabelText('Alasan pembatalan'), 'Pelanggan sakit')
    await user.click(confirm)

    await waitFor(() => expect(calls).toEqual([{ status: 'cancelled', reason: 'Pelanggan sakit' }]))
  })

  it('shows the API wording when someone else already changed the status (409)', async () => {
    capturePatch(`/admin/bookings/${BOOKING.id}/status`, () =>
      HttpResponse.json(
        {
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'Status sudah berubah oleh admin lain',
          },
        },
        { status: 409 },
      ),
    )
    const user = userEvent.setup()
    await open(BOOKING)

    await user.click(screen.getByRole('button', { name: 'Konfirmasi' }))

    expect(await screen.findByText('Status sudah berubah oleh admin lain')).toBeInTheDocument()
  })

  it('sends only the note that changed, and an empty note clears it', async () => {
    const calls = capturePatch(`/admin/bookings/${BOOKING.id}`)
    const user = userEvent.setup()
    await open(makeBooking({ admin_note: 'Catatan lama' }))

    const save = screen.getByRole('button', { name: 'Simpan catatan' })
    expect(save).toBeDisabled()

    await user.clear(screen.getByLabelText('Catatan admin'))
    await user.click(save)

    await waitFor(() => expect(calls).toEqual([{ admin_note: '' }]))
  })

  it('reschedules to a free slot, keeping the artist and service', async () => {
    const calls = capturePatch(`/admin/bookings/${BOOKING.id}`)
    server.use(
      http.get(`${API}/services`, () => HttpResponse.json({ data: [SERVICE] })),
      http.get(`${API}/artists`, () => HttpResponse.json({ data: [ARTIST] })),
      http.get(`${API}/availability`, () =>
        HttpResponse.json({
          data: {
            date: '2099-11-12',
            service_id: SERVICE.id,
            slots: [
              {
                start_at: '2099-11-12T13:00:00+07:00',
                end_at: '2099-11-12T14:30:00+07:00',
                available_artist_ids: [ARTIST.id],
              },
            ],
          },
        }),
      ),
    )
    const user = userEvent.setup()
    await open(BOOKING)

    await user.click(screen.getByRole('button', { name: 'Jadwalkan ulang' }))
    await user.click(await screen.findByRole('button', { name: '13.00' }))
    await user.click(screen.getByRole('button', { name: 'Simpan jadwal baru' }))

    await waitFor(() => expect(calls).toEqual([{ start_at: '2099-11-12T13:00:00+07:00' }]))
  })

  it('closes the panel when the reservation no longer exists', async () => {
    server.use(
      http.get(`${API}/admin/bookings/${BOOKING.id}`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'x' } }, { status: 404 }),
      ),
    )
    const onClose = vi.fn()
    await renderWithRouter(
      <>
        <ReservationDetailSheet id={BOOKING.id} onClose={onClose} />
        <Toaster />
      </>,
    )

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(await screen.findByText(/Reservasi tidak ditemukan/)).toBeInTheDocument()
  })
})
