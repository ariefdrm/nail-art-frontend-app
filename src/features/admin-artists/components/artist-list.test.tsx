import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { ARTIST } from '@/test/fixtures'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { ArtistsAdmin } from './artist-list'

import type { ArtistsSearch } from './artist-list'
import type { Artist } from '@/lib/api/types'

const DEWI: Artist = {
  ...ARTIST,
  id: '88888888-8888-4888-8888-888888888888',
  name: 'Dewi',
  is_active: false,
}

function Harness({ initial = {} }: { initial?: ArtistsSearch }) {
  const [search, setSearch] = useState<ArtistsSearch>(initial)
  return (
    <>
      <ArtistsAdmin search={search} onSearchChange={setSearch} />
      <Toaster />
    </>
  )
}

function serveArtists(artists: Artist[] = [ARTIST, DEWI]) {
  server.use(http.get(`${API}/admin/artists`, () => HttpResponse.json({ data: artists })))
}

/** Answers the two "upcoming bookings" counts (pending, confirmed). */
function serveUpcoming(pending: number, confirmed: number) {
  server.use(
    http.get(`${API}/admin/bookings`, ({ request }) => {
      const status = new URL(request.url).searchParams.get('status')
      const total = status === 'pending' ? pending : confirmed
      return HttpResponse.json({
        data: [],
        meta: { page: 1, per_page: 1, total, total_pages: total },
      })
    }),
  )
}

describe('ArtistsAdmin', () => {
  it('lists artists with an Aktif / Nonaktif marker and offers to deactivate only active ones', async () => {
    serveArtists()
    await renderWithRouter(<Harness />)

    expect(await screen.findByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Dewi')).toBeInTheDocument()
    expect(screen.getByText('Aktif')).toBeInTheDocument()
    expect(screen.getByText('Nonaktif')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nonaktifkan Owner' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nonaktifkan Dewi' })).not.toBeInTheDocument()
  })

  it('adds an artist without sending an empty photo', async () => {
    serveArtists()
    const bodies: unknown[] = []
    server.use(
      http.post(`${API}/admin/artists`, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ data: ARTIST }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await user.type(await screen.findByLabelText('Nama artist'), 'Sari')
    await user.click(screen.getByRole('button', { name: 'Tambah artist' }))

    await waitFor(() => expect(bodies).toEqual([{ name: 'Sari', is_active: true }]))
    expect(await screen.findByText('Artist ditambahkan')).toBeInTheDocument()
  })

  it('edits by sending the whole record, and can switch an artist back on', async () => {
    serveArtists()
    const bodies: unknown[] = []
    server.use(
      http.put(`${API}/admin/artists/${DEWI.id}`, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ data: DEWI })
      }),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ id: DEWI.id }} />)

    await user.click(await screen.findByRole('switch', { name: 'Aktif' }))
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    await waitFor(() =>
      expect(bodies).toEqual([{ name: 'Dewi', is_active: true, photo_url: null }]),
    )
  })

  it('asks for a name before calling the API', async () => {
    serveArtists()
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await screen.findByLabelText('Nama artist')
    await user.click(screen.getByRole('button', { name: 'Tambah artist' }))

    expect(await screen.findByText('Nama wajib diisi')).toBeInTheDocument()
  })

  it('warns that an artist still has upcoming reservations before deactivating', async () => {
    serveArtists()
    serveUpcoming(2, 3)
    const calls: string[] = []
    server.use(
      http.delete(`${API}/admin/artists/${ARTIST.id}`, () => {
        calls.push('delete')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    await user.click(await screen.findByRole('button', { name: 'Nonaktifkan Owner' }))

    expect(await screen.findByText(/masih punya 5 reservasi mendatang/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nonaktifkan' }))
    await waitFor(() => expect(calls).toEqual(['delete']))
    expect(await screen.findByText('Artist Owner dinonaktifkan')).toBeInTheDocument()
  })

  it('does not warn when nothing is coming up', async () => {
    serveArtists()
    serveUpcoming(0, 0)
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    await user.click(await screen.findByRole('button', { name: 'Nonaktifkan Owner' }))

    expect(await screen.findByText(/Artist tidak lagi bisa dipilih/)).toBeInTheDocument()
    expect(screen.queryByText(/reservasi mendatang/)).not.toBeInTheDocument()
  })

  it('shows an empty state that invites adding the first artist', async () => {
    serveArtists([])
    await renderWithRouter(<Harness />)
    expect(await screen.findByText('Belum ada artist')).toBeInTheDocument()
  })
})
