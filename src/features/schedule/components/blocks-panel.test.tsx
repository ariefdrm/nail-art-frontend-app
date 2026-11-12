import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { ARTIST } from '@/test/fixtures'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { BlocksPanel } from './blocks-panel'

import type { BlocksSearch } from './blocks-panel'

const STUDIO_BLOCK = {
  id: '99999999-9999-4999-8999-999999999999',
  artist_id: null,
  start_at: '2099-12-24T09:00:00+07:00',
  end_at: '2099-12-26T17:00:00+07:00',
  reason: 'Libur Natal',
}
const ARTIST_BLOCK = {
  id: '77777777-7777-4777-8777-777777777777',
  artist_id: ARTIST.id,
  start_at: '2099-12-30T10:00:00+07:00',
  end_at: '2099-12-30T12:00:00+07:00',
  reason: null,
}

function conflict(code: string, name: string) {
  return {
    id: `id-${code}`,
    booking_code: code,
    status: 'confirmed',
    start_at: '2099-12-24T10:00:00+07:00',
    end_at: '2099-12-24T11:30:00+07:00',
    customer_name: name,
    service_name: 'Gel Polish',
    contact_url: `https://wa.me/62812000000?text=Halo%20${name}`,
  }
}

function serveBlocks(blocks = [STUDIO_BLOCK, ARTIST_BLOCK]) {
  server.use(
    http.get(`${API}/admin/blocked-slots`, () => HttpResponse.json({ data: blocks })),
    http.get(`${API}/artists`, () => HttpResponse.json({ data: [ARTIST] })),
  )
}

/** Records the order of calls, so a test can prove "check first, then create". */
function record(check: () => Response, create: (body: Record<string, unknown>) => Response) {
  const calls: { kind: 'check' | 'create'; body: Record<string, unknown> }[] = []
  server.use(
    http.post(`${API}/admin/blocked-slots/check`, async ({ request }) => {
      calls.push({ kind: 'check', body: (await request.json()) as Record<string, unknown> })
      return check()
    }),
    http.post(`${API}/admin/blocked-slots`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      calls.push({ kind: 'create', body })
      return create(body)
    }),
  )
  return calls
}

const created = (affected: unknown[] = []) =>
  HttpResponse.json({ data: { ...STUDIO_BLOCK, affected_bookings: affected } }, { status: 201 })

function Harness({ initial = {} }: { initial?: BlocksSearch }) {
  const [search, setSearch] = useState<BlocksSearch>(initial)
  return (
    <>
      <BlocksPanel search={search} onSearchChange={setSearch} />
      <Toaster />
    </>
  )
}

async function submitBlock(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Alasan (opsional)'), 'Libur Natal')
  await user.click(screen.getByRole('button', { name: 'Blokir waktu' }))
}

describe('BlocksPanel list', () => {
  it('lists blocks with their range, scope and reason', async () => {
    serveBlocks()
    await renderWithRouter(<Harness />)

    expect(await screen.findByText('Libur Natal')).toBeInTheDocument()
    expect(screen.getByText('Seluruh studio')).toBeInTheDocument()
    expect(await screen.findByText('Owner')).toBeInTheDocument()
  })

  it('invites blocking when nothing is blocked', async () => {
    serveBlocks([])
    await renderWithRouter(<Harness />)
    expect(await screen.findByText('Belum ada waktu yang diblokir')).toBeInTheDocument()
  })

  it('only asks for upcoming blocks unless past ones are requested', async () => {
    const asked: URLSearchParams[] = []
    server.use(
      http.get(`${API}/admin/blocked-slots`, ({ request }) => {
        asked.push(new URL(request.url).searchParams)
        return HttpResponse.json({ data: [] })
      }),
      http.get(`${API}/artists`, () => HttpResponse.json({ data: [] })),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    await screen.findByText('Belum ada waktu yang diblokir')
    expect(asked[0]?.get('date_from')).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    await user.click(screen.getByRole('switch'))
    await waitFor(() => expect(asked.at(-1)?.has('date_from')).toBe(false))
  })

  it('removes a block after asking', async () => {
    serveBlocks()
    const removed: string[] = []
    server.use(
      http.delete(`${API}/admin/blocked-slots/${STUDIO_BLOCK.id}`, () => {
        removed.push(STUDIO_BLOCK.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness />)

    await user.click(
      (await screen.findAllByRole('button', { name: /Hapus blokir/ }))[0] as HTMLElement,
    )
    expect(await screen.findByText('Hapus blokir ini?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hapus blokir' }))

    await waitFor(() => expect(removed).toEqual([STUDIO_BLOCK.id]))
    expect(await screen.findByText(/Blokir dihapus/)).toBeInTheDocument()
  })
})

describe('NewBlockForm', () => {
  it('checks first, then blocks, in WIB, without acknowledging anything', async () => {
    serveBlocks()
    const calls = record(
      () => HttpResponse.json({ data: { can_block: true, conflicts: [] } }),
      () => created(),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await submitBlock(user)

    expect(await screen.findByText('Waktu berhasil diblokir.')).toBeInTheDocument()
    expect(screen.getByText('Tidak ada reservasi yang terdampak.')).toBeInTheDocument()
    expect(calls.map((call) => call.kind)).toEqual(['check', 'create'])
    expect(calls[1]?.body).toMatchObject({ reason: 'Libur Natal' })
    expect(calls[1]?.body.start_at).toMatch(/T09:00:00\+07:00$/)
    expect(calls[1]?.body.end_at).toMatch(/T17:00:00\+07:00$/)
    expect(calls[1]?.body).not.toHaveProperty('acknowledge_conflicts')
    expect(calls[1]?.body).not.toHaveProperty('artist_id')
  })

  it('shows who is affected and blocks only after "Tetap blokir"', async () => {
    serveBlocks()
    const conflicts = [conflict('NP-20991224-AAAA', 'Siti'), conflict('NP-20991224-BBBB', 'Budi')]
    const calls = record(
      () => HttpResponse.json({ data: { can_block: false, conflicts } }),
      () => created(conflicts),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await submitBlock(user)

    expect(await screen.findByText('Ada 2 reservasi pada waktu ini')).toBeInTheDocument()
    expect(screen.getByText('NP-20991224-AAAA')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Hubungi Siti/ })
    expect(link).toHaveAttribute('href', 'https://wa.me/62812000000?text=Halo%20Siti')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(calls.map((call) => call.kind)).toEqual(['check'])

    await user.click(screen.getByRole('button', { name: 'Tetap blokir' }))

    await waitFor(() => expect(calls.map((call) => call.kind)).toEqual(['check', 'create']))
    expect(calls[1]?.body).toMatchObject({ acknowledge_conflicts: true })
    expect(await screen.findByText(/2 reservasi terdampak/)).toBeInTheDocument()
    expect(screen.getByText(/jadwalkan ulang atau batalkan/)).toBeInTheDocument()
  })

  it('creates nothing when the owner backs out of the conflict dialog', async () => {
    serveBlocks()
    const calls = record(
      () =>
        HttpResponse.json({
          data: { can_block: false, conflicts: [conflict('NP-20991224-AAAA', 'Siti')] },
        }),
      () => created(),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await submitBlock(user)
    await user.click(await screen.findByRole('button', { name: 'Kembali' }))

    expect(calls.map((call) => call.kind)).toEqual(['check'])
    expect(screen.queryByText('Waktu berhasil diblokir.')).not.toBeInTheDocument()
  })

  it('handles a booking that slipped in after the check (409 BLOCK_HAS_BOOKINGS)', async () => {
    serveBlocks()
    const late = [conflict('NP-20991224-CCCC', 'Dewi')]
    record(
      () => HttpResponse.json({ data: { can_block: true, conflicts: [] } }),
      (body) =>
        body.acknowledge_conflicts
          ? created(late)
          : HttpResponse.json(
              { error: { code: 'BLOCK_HAS_BOOKINGS', message: 'x', conflicts: late } },
              { status: 409 },
            ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await submitBlock(user)

    expect(await screen.findByText('Ada 1 reservasi pada waktu ini')).toBeInTheDocument()
    expect(screen.getByText('NP-20991224-CCCC')).toBeInTheDocument()
  })

  it('blocks a single artist when one is chosen', async () => {
    serveBlocks()
    const calls = record(
      () => HttpResponse.json({ data: { can_block: true, conflicts: [] } }),
      () => created(),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    await screen.findByRole('option', { name: 'Hanya Owner' })
    await user.selectOptions(screen.getByLabelText('Yang diblokir'), ARTIST.id)
    await submitBlock(user)

    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[0]?.body).toMatchObject({ artist_id: ARTIST.id })
    expect(calls[1]?.body).toMatchObject({ artist_id: ARTIST.id })
  })

  it('refuses an end before the start without calling the API', async () => {
    serveBlocks()
    const calls = record(
      () => HttpResponse.json({ data: { can_block: true, conflicts: [] } }),
      () => created(),
    )
    const user = userEvent.setup()
    await renderWithRouter(<Harness initial={{ baru: true }} />)

    const endTime = await screen.findByLabelText('Jam', { selector: '#end_time' })
    await user.clear(endTime)
    await user.type(endTime, '08:00')
    await user.click(screen.getByRole('button', { name: 'Blokir waktu' }))

    expect(await screen.findByText('Selesai harus setelah mulai')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })
})
