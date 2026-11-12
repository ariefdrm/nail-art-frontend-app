import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { ARTIST, makeBooking, SERVICE } from '@/test/fixtures'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { ManualReservationForm } from './manual-reservation-form'

const SLOT = '2099-11-12T10:00:00+07:00'

function serveCatalog(onAvailability: (params: URLSearchParams) => void = () => undefined) {
  server.use(
    http.get(`${API}/services`, () => HttpResponse.json({ data: [SERVICE] })),
    http.get(`${API}/artists`, () => HttpResponse.json({ data: [ARTIST] })),
    http.get(`${API}/availability`, ({ request }) => {
      onAvailability(new URL(request.url).searchParams)
      return HttpResponse.json({
        data: {
          date: '2099-11-12',
          service_id: SERVICE.id,
          slots: [
            {
              start_at: SLOT,
              end_at: '2099-11-12T11:30:00+07:00',
              available_artist_ids: [ARTIST.id],
            },
            {
              start_at: '2099-11-12T13:00:00+07:00',
              end_at: '2099-11-12T14:30:00+07:00',
              available_artist_ids: [ARTIST.id],
            },
          ],
        },
      })
    }),
  )
}

function captureCreate(
  respond: () => Response = () =>
    HttpResponse.json({ data: makeBooking({ status: 'confirmed' }) }, { status: 201 }),
) {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.post(`${API}/admin/bookings`, async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>)
      return respond()
    }),
  )
  return bodies
}

async function render(onCreated = vi.fn()) {
  await renderWithRouter(
    <>
      <ManualReservationForm onCreated={onCreated} />
      <Toaster />
    </>,
  )
  await screen.findByRole('option', { name: /Gel Polish/ })
  return onCreated
}

async function fillEverything(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText('Layanan'), SERVICE.id)
  await user.click(await screen.findByRole('button', { name: '10.00' }))
  await user.type(screen.getByLabelText('Nama'), 'Siti Rahayu')
  await user.type(screen.getByLabelText('Nomor HP'), '0812-3456-7890')
}

describe('ManualReservationForm', () => {
  it('creates a reservation with the slot exactly as the API listed it', async () => {
    serveCatalog()
    const bodies = captureCreate()
    const user = userEvent.setup()
    const onCreated = await render()

    await fillEverything(user)
    await user.click(screen.getByRole('button', { name: 'Buat reservasi' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(bodies).toEqual([
      {
        service_id: SERVICE.id,
        start_at: SLOT,
        customer_name: 'Siti Rahayu',
        customer_phone: '+6281234567890',
      },
    ])
    expect(await screen.findByText(/Reservasi NP-20261112-A7K2 dibuat/)).toBeInTheDocument()
  })

  it('sends the chosen artist and asks for slots of that artist only', async () => {
    const asked: URLSearchParams[] = []
    serveCatalog((params) => asked.push(params))
    const bodies = captureCreate()
    const user = userEvent.setup()
    await render()

    await user.selectOptions(screen.getByLabelText('Artist'), ARTIST.id)
    await fillEverything(user)
    await user.click(screen.getByRole('button', { name: 'Buat reservasi' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ artist_id: ARTIST.id })
    expect(asked.some((params) => params.get('artist_id') === ARTIST.id)).toBe(true)
  })

  it('forgets the chosen time when the artist changes', async () => {
    serveCatalog()
    const user = userEvent.setup()
    await render()

    await user.selectOptions(screen.getByLabelText('Layanan'), SERVICE.id)
    await user.click(await screen.findByRole('button', { name: '10.00' }))
    expect(screen.getByRole('button', { name: '10.00' })).toHaveAttribute('aria-pressed', 'true')

    await user.selectOptions(screen.getByLabelText('Artist'), ARTIST.id)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '10.00' })).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
    )
  })

  it('asks for what is missing before calling the API', async () => {
    serveCatalog()
    const bodies = captureCreate()
    const user = userEvent.setup()
    await render()

    await user.click(screen.getByRole('button', { name: 'Buat reservasi' }))

    // "Pilih layanan" is also the empty option's label, so read the alerts, not the text.
    await waitFor(() =>
      expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual(
        expect.arrayContaining([
          'Pilih layanan',
          'Pilih jam',
          'Nama wajib diisi',
          'Nomor HP wajib diisi',
        ]),
      ),
    )
    expect(bodies).toHaveLength(0)
  })

  it('on 409 asks for another time, clears the slot and keeps the customer details', async () => {
    serveCatalog()
    captureCreate(() =>
      HttpResponse.json({ error: { code: 'SLOT_UNAVAILABLE', message: 'x' } }, { status: 409 }),
    )
    const user = userEvent.setup()
    const onCreated = await render()

    await fillEverything(user)
    await user.click(screen.getByRole('button', { name: 'Buat reservasi' }))

    expect(await screen.findByText(/Jadwal tersebut baru saja terisi/)).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nama')).toHaveValue('Siti Rahayu')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '10.00' })).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
    )
  })

  it('shows a server validation message on its field (422)', async () => {
    serveCatalog()
    captureCreate(() =>
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
    )
    const user = userEvent.setup()
    await render()

    await fillEverything(user)
    await user.click(screen.getByRole('button', { name: 'Buat reservasi' }))

    expect(await screen.findByText('Nomor tidak dikenali server')).toBeInTheDocument()
  })
})
