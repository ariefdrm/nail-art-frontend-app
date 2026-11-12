import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { ExportPanel } from './export-panel'

import type * as Download from '@/lib/download'

const saved = vi.hoisted(() => vi.fn())
vi.mock('@/lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof Download>()),
  saveBlob: saved,
}))

function serveCsv(headers: Record<string, string> = {}, seen: URLSearchParams[] = []) {
  server.use(
    http.get(`${API}/admin/export/bookings.csv`, ({ request }) => {
      seen.push(new URL(request.url).searchParams)
      return new HttpResponse('booking_id,status\r\nx,confirmed\r\n', {
        headers: { 'Content-Type': 'text/csv', ...headers },
      })
    }),
  )
  return seen
}

async function render() {
  saved.mockClear()
  await renderWithRouter(
    <>
      <ExportPanel />
      <Toaster />
    </>,
  )
}

describe('ExportPanel', () => {
  it('says what the file contains and what it leaves out', async () => {
    await render()
    expect(screen.getByText(/tidak berisi nama, nomor HP, kode booking/)).toBeInTheDocument()
    expect(screen.getByText('customer_ref')).toBeInTheDocument()
  })

  it('downloads through the API client and saves the file under its own name', async () => {
    serveCsv({ 'Content-Disposition': 'attachment; filename="bookings_2026-11-01_2026-11-30.csv"' })
    const user = userEvent.setup()
    await render()

    await user.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1))
    expect(saved.mock.calls[0]?.[1]).toBe('bookings_2026-11-01_2026-11-30.csv')
    expect(saved.mock.calls[0]?.[0]).toBeInstanceOf(Blob)
    expect(
      await screen.findByText(/bookings_2026-11-01_2026-11-30.csv diunduh/),
    ).toBeInTheDocument()
  })

  it('names the file itself when the header cannot be read, and sends the filters', async () => {
    const seen = serveCsv()
    const user = userEvent.setup()
    await render()

    await user.type(screen.getByLabelText('Dari tanggal (opsional)'), '2026-11-01')
    await user.type(screen.getByLabelText('Sampai tanggal (opsional)'), '2026-11-30')
    await user.selectOptions(screen.getByLabelText('Status (opsional)'), 'completed')
    await user.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    await waitFor(() => expect(saved).toHaveBeenCalled())
    expect(saved.mock.calls[0]?.[1]).toBe('bookings_2026-11-01_2026-11-30.csv')
    expect(Object.fromEntries(seen[0] ?? [])).toEqual({
      date_from: '2026-11-01',
      date_to: '2026-11-30',
      status: 'completed',
    })
  })

  it('refuses a reversed range before downloading anything', async () => {
    const seen = serveCsv()
    const user = userEvent.setup()
    await render()

    await user.type(screen.getByLabelText('Dari tanggal (opsional)'), '2026-11-30')
    await user.type(screen.getByLabelText('Sampai tanggal (opsional)'), '2026-11-01')

    expect(
      await screen.findByText(/Tanggal akhir tidak boleh sebelum tanggal awal/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unduh CSV' })).toBeDisabled()
    expect(seen).toHaveLength(0)
  })

  it('explains a 403 instead of failing silently', async () => {
    server.use(
      http.get(`${API}/admin/export/bookings.csv`, () =>
        HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'x' } }, { status: 403 }),
      ),
    )
    const user = userEvent.setup()
    await render()

    await user.click(screen.getByRole('button', { name: 'Unduh CSV' }))

    expect(await screen.findByText('Anda tidak memiliki akses ke fitur ini.')).toBeInTheDocument()
    expect(saved).not.toHaveBeenCalled()
  })
})
