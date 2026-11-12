import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { SERVICE } from '@/test/fixtures'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { ServicesAdmin } from './service-list'

import type { ServicesSearch } from './service-list'
import type { Service } from '@/lib/api/types'

const GEL: Service = { ...SERVICE }
const ART: Service = {
  ...SERVICE,
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Nail Art',
  category: 'nail_art',
  price: 250000,
  duration_minutes: 120,
  is_active: false,
}

function serveList(services: () => Service[]) {
  server.use(http.get(`${API}/admin/services`, () => HttpResponse.json({ data: services() })))
}

function Harness({ initial = {} }: { initial?: ServicesSearch }) {
  const [search, setSearch] = useState<ServicesSearch>(initial)
  return (
    <>
      <ServicesAdmin search={search} onSearchChange={setSearch} />
      <Toaster />
    </>
  )
}

describe('ServicesAdmin', () => {
  it('lists services by name with duration, price and an Aktif / Nonaktif marker', async () => {
    serveList(() => [GEL, ART])
    await renderWithRouter(<Harness />)

    expect(await screen.findByText('Gel Polish')).toBeInTheDocument()
    expect(screen.getByText('Nail Art')).toBeInTheDocument()
    expect(screen.getByText('1 j 30 mnt')).toBeInTheDocument()
    expect(screen.getByText('Rp250.000')).toBeInTheDocument()
    expect(screen.getByText('Aktif')).toBeInTheDocument()
    expect(screen.getByText('Nonaktif')).toBeInTheDocument()
  })

  it('invites adding the first service when there are none', async () => {
    serveList(() => [])
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    expect(await screen.findByText('Belum ada layanan')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Tambah layanan' })[0] as HTMLElement)
    expect(await screen.findByRole('heading', { name: 'Tambah layanan' })).toBeInTheDocument()
  })

  it('adds a service, turning the category label into its slug', async () => {
    serveList(() => [GEL])
    const bodies: unknown[] = []
    server.use(
      http.post(`${API}/admin/services`, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ data: GEL }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await user.type(await screen.findByLabelText('Nama layanan'), 'Pedicure Spa')
    await user.type(screen.getByLabelText('Kategori'), 'Pedicure Spa')
    await user.type(screen.getByLabelText('Harga (Rp)'), '130000')
    await user.selectOptions(screen.getByLabelText('Durasi'), '90')
    await user.click(screen.getByRole('button', { name: 'Tambah layanan' }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          name: 'Pedicure Spa',
          category: 'pedicure_spa',
          price: 130000,
          duration_minutes: 90,
          is_active: true,
        },
      ]),
    )
    expect(await screen.findByText('Layanan ditambahkan')).toBeInTheDocument()
  })

  it('edits a service by sending the whole record', async () => {
    serveList(() => [GEL])
    const bodies: unknown[] = []
    server.use(
      http.put(`${API}/admin/services/${GEL.id}`, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ data: GEL })
      }),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ id: GEL.id }} />)

    const price = await screen.findByLabelText('Harga (Rp)')
    expect(price).toHaveValue('150000')
    await user.clear(price)
    await user.type(price, '175000')
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          name: 'Gel Polish',
          category: 'gel_polish',
          price: 175000,
          duration_minutes: 90,
          is_active: true,
          description: '',
          image_url: null,
        },
      ]),
    )
  })

  it('can switch a service off', async () => {
    serveList(() => [GEL])
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.put(`${API}/admin/services/${GEL.id}`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({ data: GEL })
      }),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ id: GEL.id }} />)

    await user.click(await screen.findByRole('switch', { name: 'Aktif' }))
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    await waitFor(() => expect(bodies[0]?.is_active).toBe(false))
  })

  it('checks the form before calling the API', async () => {
    serveList(() => [GEL])
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await screen.findByLabelText('Nama layanan')
    await user.type(screen.getByLabelText('Harga (Rp)'), '150.000')
    await user.click(screen.getByRole('button', { name: 'Tambah layanan' }))

    expect(await screen.findByText('Nama wajib diisi')).toBeInTheDocument()
    expect(screen.getByText('Kategori wajib diisi')).toBeInTheDocument()
    expect(screen.getByText(/Harga harus berupa angka bulat/)).toBeInTheDocument()
  })

  it('shows a server validation message on its field (422)', async () => {
    serveList(() => [GEL])
    server.use(
      http.post(`${API}/admin/services`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'x',
              details: [{ field: 'name', message: 'Nama sudah dipakai' }],
            },
          },
          { status: 422 },
        ),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await user.type(await screen.findByLabelText('Nama layanan'), 'Gel Polish')
    await user.type(screen.getByLabelText('Kategori'), 'Gel')
    await user.type(screen.getByLabelText('Harga (Rp)'), '1000')
    await user.click(screen.getByRole('button', { name: 'Tambah layanan' }))

    expect(await screen.findByText('Nama sudah dipakai')).toBeInTheDocument()
  })

  it('says a service was deleted when it is gone afterwards', async () => {
    let services = [GEL, ART]
    serveList(() => services)
    server.use(
      http.delete(`${API}/admin/services/${GEL.id}`, () => {
        services = [ART]
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    await user.click(await screen.findByRole('button', { name: 'Hapus Gel Polish' }))
    expect(await screen.findByText('Hapus layanan Gel Polish?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hapus layanan' }))

    expect(await screen.findByText('Layanan Gel Polish dihapus')).toBeInTheDocument()
  })

  it('says a service was only deactivated when bookings still refer to it', async () => {
    serveList(() => [GEL, ART])
    server.use(
      http.delete(`${API}/admin/services/${GEL.id}`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    await user.click(await screen.findByRole('button', { name: 'Hapus Gel Polish' }))
    await user.click(await screen.findByRole('button', { name: 'Hapus layanan' }))

    expect(
      await screen.findByText('Layanan Gel Polish dinonaktifkan karena sudah punya reservasi'),
    ).toBeInTheDocument()
  })

  it('shows an error with a retry that recovers', async () => {
    let fail = true
    server.use(
      http.get(`${API}/admin/services`, () =>
        fail
          ? HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
          : HttpResponse.json({ data: [GEL] }),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    expect(await screen.findByText(/kesalahan pada server/)).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('Gel Polish')).toBeInTheDocument()
  })
})
