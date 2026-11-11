import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { ServiceCatalog } from './service-catalog'

import type { CatalogSearch } from './service-catalog'

const GEL = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Gel Polish',
  description: 'Warna tahan lama',
  category: 'gel_polish',
  price: 150000,
  duration_minutes: 90,
  image_url: null,
  is_active: true,
}
const ART = {
  ...GEL,
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Nail Art',
  category: 'nail_art',
  price: 250000,
  duration_minutes: 120,
}

function Harness({ initial = {} }: { initial?: CatalogSearch }) {
  const [search, setSearch] = useState<CatalogSearch>(initial)
  return <ServiceCatalog search={search} onSearchChange={setSearch} />
}

describe('ServiceCatalog', () => {
  it('shows services with formatted duration and price', async () => {
    server.use(http.get(`${API}/services`, () => HttpResponse.json({ data: [GEL, ART] })))
    await renderWithRouter(<Harness />)

    expect(await screen.findByRole('button', { name: /Gel Polish/ })).toHaveTextContent(
      /1 j 30 mnt.*Rp150\.000/s,
    )
    expect(screen.getByRole('button', { name: /Nail Art/ })).toHaveTextContent('2 j')
  })

  it('filters by category and can clear the filter', async () => {
    server.use(http.get(`${API}/services`, () => HttpResponse.json({ data: [GEL, ART] })))
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    await user.click(await screen.findByRole('button', { name: 'Nail art' }))
    expect(screen.queryByRole('button', { name: /Gel Polish/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Nail Art/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Semua' }))
    expect(await screen.findByRole('button', { name: /Gel Polish/ })).toBeInTheDocument()
  })

  it('shows an empty state when there are no services', async () => {
    server.use(http.get(`${API}/services`, () => HttpResponse.json({ data: [] })))
    await renderWithRouter(<Harness />)
    expect(await screen.findByText('Belum ada layanan')).toBeInTheDocument()
  })

  it('shows an error with a retry that recovers', async () => {
    let fail = true
    server.use(
      http.get(`${API}/services`, () =>
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
    expect(await screen.findByRole('button', { name: /Gel Polish/ })).toBeInTheDocument()
  })

  it('opens the detail sheet from the card and links to booking', async () => {
    server.use(
      http.get(`${API}/services`, () => HttpResponse.json({ data: [GEL] })),
      http.get(`${API}/services/${GEL.id}`, () => HttpResponse.json({ data: GEL })),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    await user.click(await screen.findByRole('button', { name: /Gel Polish/ }))
    expect(await screen.findByText('Warna tahan lama')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pesan layanan ini' })).toHaveAttribute(
      'href',
      expect.stringContaining(`layanan=${GEL.id}`),
    )
  })

  it('explains a service that no longer exists', async () => {
    server.use(
      http.get(`${API}/services`, () => HttpResponse.json({ data: [GEL] })),
      http.get(`${API}/services/${GEL.id}`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'x' } }, { status: 404 }),
      ),
    )
    await renderWithRouter(<Harness initial={{ layanan: GEL.id }} />)
    await waitFor(() =>
      expect(screen.getByText('Layanan ini sudah tidak tersedia.')).toBeInTheDocument(),
    )
  })
})
