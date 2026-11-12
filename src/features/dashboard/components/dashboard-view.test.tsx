import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { addDaysWib, todayWib } from '@/lib/format'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { DashboardView } from './dashboard-view'

const SUMMARY = {
  period: { date_from: '2026-11-06', date_to: '2026-11-12' },
  total_bookings: 34,
  by_status: { pending: 3, confirmed: 16, completed: 10, cancelled: 3, no_show: 2 },
  no_show_rate: 0.075,
  online_booking_ratio: 0.72,
  revenue_completed: 4250000,
  avg_confirmation_minutes: 18.4,
}

function serve(summary: object = SUMMARY, seen: URLSearchParams[] = []) {
  server.use(
    http.get(`${API}/admin/dashboard/summary`, ({ request }) => {
      seen.push(new URL(request.url).searchParams)
      return HttpResponse.json({ data: summary })
    }),
  )
  return seen
}

async function render(search = {}, onSearchChange = vi.fn()) {
  await renderWithRouter(
    <DashboardView adminName="Siti" search={search} onSearchChange={onSearchChange} />,
  )
  return onSearchChange
}

describe('DashboardView', () => {
  it('shows the headline numbers in Indonesian formats', async () => {
    serve()
    await render({ dari: '2026-11-06', sampai: '2026-11-12' })

    expect(await screen.findByText('34')).toBeInTheDocument()
    expect(screen.getByText('Rp4.250.000')).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('7,5%')).toBeInTheDocument()
    expect(screen.getByText('18 menit')).toBeInTheDocument()
    expect(screen.getByText(/Halo, Siti/)).toBeInTheDocument()
  })

  it('breaks the reservations down by status with a count each', async () => {
    serve()
    await render({ dari: '2026-11-06', sampai: '2026-11-12' })

    const list = await screen.findByRole('list')
    for (const [label, count] of [
      ['Terkonfirmasi', '16'],
      ['Selesai', '10'],
      ['Menunggu konfirmasi', '3'],
      ['Dibatalkan', '3'],
      ['Tidak hadir', '2'],
    ]) {
      const row = within(list)
        .getByText(label as string)
        .closest('li')
      expect(row).toHaveTextContent(count as string)
    }
  })

  it('shows a dash and "Belum ada data" for missing rates, never 0%', async () => {
    serve({
      ...SUMMARY,
      total_bookings: 0,
      by_status: {},
      no_show_rate: null,
      online_booking_ratio: null,
      avg_confirmation_minutes: null,
      revenue_completed: 0,
    })
    await render({ dari: '2026-11-06', sampai: '2026-11-12' })

    await screen.findByText('Rasio online')
    expect(screen.getAllByText('Belum ada data')).toHaveLength(3)
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(3)
    expect(screen.getByText('Rp0')).toBeInTheDocument()
  })

  it('keeps a real zero rate as 0%', async () => {
    serve({ ...SUMMARY, no_show_rate: 0 })
    await render({ dari: '2026-11-06', sampai: '2026-11-12' })
    expect(await screen.findByText('0%')).toBeInTheDocument()
  })

  it('opens on the last seven days when the URL has no dates', async () => {
    const seen = serve()
    await render({})

    await screen.findByText('34')
    expect(seen[0]?.get('date_to')).toBe(todayWib())
    expect(seen[0]?.get('date_from')).toBe(addDaysWib(todayWib(), -6))
    expect(screen.getByRole('button', { name: '7 hari' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches range from the presets and the date fields', async () => {
    serve()
    const user = userEvent.setup()
    const onSearchChange = await render({ dari: '2026-11-06', sampai: '2026-11-12' })

    await user.click(screen.getByRole('button', { name: 'Bulan lalu' }))
    expect(onSearchChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ dari: expect.stringMatching(/^\d{4}-\d{2}-01$/) }),
    )
    expect(screen.getByRole('button', { name: 'Kustom' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('refuses a reversed or over-long range without asking the API', async () => {
    const seen = serve()
    await render({ dari: '2026-11-12', sampai: '2026-11-01' })

    expect(
      await screen.findByText(/Tanggal akhir tidak boleh sebelum tanggal awal/),
    ).toBeInTheDocument()
    expect(seen).toHaveLength(0)
  })

  it('shows an error with a retry that recovers', async () => {
    let fail = true
    server.use(
      http.get(`${API}/admin/dashboard/summary`, () =>
        fail
          ? HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
          : HttpResponse.json({ data: SUMMARY }),
      ),
    )
    const user = userEvent.setup()
    await render({ dari: '2026-11-06', sampai: '2026-11-12' })

    expect(await screen.findByText(/kesalahan pada server/)).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    await waitFor(() => expect(screen.getByText('34')).toBeInTheDocument())
  })
})
