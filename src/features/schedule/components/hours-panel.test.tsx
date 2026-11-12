import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { HoursPanel } from './hours-panel'

type Row = {
  day_of_week: number
  is_open: boolean
  open_time?: string | null
  close_time?: string | null
  break_start?: string | null
  break_end?: string | null
}

const WORKDAY = {
  is_open: true,
  open_time: '09:00',
  close_time: '17:00',
  break_start: '12:00',
  break_end: '13:00',
}
const WEEK: Row[] = [
  { day_of_week: 0, is_open: false },
  ...[1, 2, 3, 4, 5, 6].map((day_of_week) => ({ day_of_week, ...WORKDAY })),
]

function serveHours(rows: Row[] = WEEK) {
  server.use(http.get(`${API}/admin/business-hours`, () => HttpResponse.json({ data: rows })))
}

function capturePut(respond?: () => Response) {
  const bodies: { hours: Row[] }[] = []
  server.use(
    http.put(`${API}/admin/business-hours`, async ({ request }) => {
      const body = (await request.json()) as { hours: Row[] }
      bodies.push(body)
      return respond ? respond() : HttpResponse.json({ data: body.hours })
    }),
  )
  return bodies
}

async function render() {
  await renderWithRouter(
    <>
      <HoursPanel />
      <Toaster />
    </>,
  )
  await screen.findByLabelText('Senin: jam buka')
}

describe('HoursPanel', () => {
  it('shows the week from Monday with each day open or closed', async () => {
    serveHours()
    await render()

    expect(screen.getByLabelText('Senin: jam buka')).toHaveValue('09:00')
    expect(screen.getByLabelText('Senin: jam tutup')).toHaveValue('17:00')
    expect(screen.getByLabelText('Senin: mulai istirahat')).toHaveValue('12:00')
    expect(screen.getByRole('switch', { name: 'Minggu: buka' })).not.toBeChecked()
    expect(screen.getByText('Studio tutup pada hari ini.')).toBeInTheDocument()
    const days = screen.getAllByRole('switch').map((toggle) => toggle.getAttribute('aria-label'))
    expect(days[0]).toBe('Senin: buka')
    expect(days.at(-1)).toBe('Minggu: buka')
  })

  it('explains that changes only affect upcoming slots', async () => {
    serveHours()
    await render()
    expect(screen.getByText(/hanya berlaku untuk jadwal ke depan/)).toBeInTheDocument()
  })

  it('cannot be saved until something changes', async () => {
    serveHours()
    await render()
    expect(screen.getByRole('button', { name: 'Simpan perubahan' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Senin: jam tutup'), { target: { value: '18:00' } })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Simpan perubahan' })).toBeEnabled(),
    )
  })

  it('saves all seven days in order, closed days without times', async () => {
    serveHours()
    const bodies = capturePut()
    const user = userEvent.setup()
    await render()

    fireEvent.change(screen.getByLabelText('Senin: jam tutup'), { target: { value: '18:00' } })
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    const hours = bodies[0]?.hours ?? []
    expect(hours.map((day) => day.day_of_week)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(hours[0]).toEqual({ day_of_week: 0, is_open: false })
    expect(hours[1]).toEqual({
      day_of_week: 1,
      is_open: true,
      open_time: '09:00',
      close_time: '18:00',
      break_start: '12:00',
      break_end: '13:00',
    })
    expect(await screen.findByText('Jam operasional disimpan')).toBeInTheDocument()
  })

  it('refuses closing before opening, and a break outside opening hours, before calling the API', async () => {
    serveHours()
    const bodies = capturePut()
    const user = userEvent.setup()
    await render()

    fireEvent.change(screen.getByLabelText('Senin: jam tutup'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('Selasa: mulai istirahat'), {
      target: { value: '07:00' },
    })
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    expect(await screen.findByText(/Jam tutup harus setelah jam buka/)).toBeInTheDocument()
    // Monday's break also falls outside its (now impossible) hours, so more than one day complains.
    expect(
      screen.getAllByText(/Istirahat harus berada di dalam jam buka/).length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Jam tutup harus setelah jam buka/)).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })

  it('opens a closed day with empty times and asks for them', async () => {
    serveHours()
    const bodies = capturePut()
    const user = userEvent.setup()
    await render()

    await user.click(screen.getByRole('switch', { name: 'Minggu: buka' }))
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    expect(await screen.findByText(/Jam buka wajib diisi/)).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })

  it('copies Monday onto Tuesday to Saturday and leaves Sunday alone', async () => {
    serveHours([
      { day_of_week: 0, is_open: false },
      {
        day_of_week: 1,
        is_open: true,
        open_time: '10:00',
        close_time: '15:00',
        break_start: null,
        break_end: null,
      },
      ...[2, 3, 4, 5, 6].map((day_of_week) => ({ day_of_week, ...WORKDAY })),
    ])
    const bodies = capturePut()
    const user = userEvent.setup()
    await render()

    await user.click(screen.getByRole('button', { name: /Salin Senin/ }))
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    const hours = bodies[0]?.hours ?? []
    for (const day of [2, 3, 4, 5, 6]) {
      expect(hours[day]).toEqual({
        day_of_week: day,
        is_open: true,
        open_time: '10:00',
        close_time: '15:00',
      })
    }
    expect(hours[0]).toEqual({ day_of_week: 0, is_open: false })
  })

  it('puts a server complaint on the day and field it names (422)', async () => {
    serveHours()
    capturePut(() =>
      HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'x',
            details: [{ field: 'hours.3.close_time', message: 'Jam tutup tidak valid' }],
          },
        },
        { status: 422 },
      ),
    )
    const user = userEvent.setup()
    await render()

    fireEvent.change(screen.getByLabelText('Senin: jam tutup'), { target: { value: '18:00' } })
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    expect(await screen.findByText('Jam tutup tidak valid')).toBeInTheDocument()
  })

  it('discards edits on request', async () => {
    serveHours()
    const user = userEvent.setup()
    await render()

    fireEvent.change(screen.getByLabelText('Senin: jam tutup'), { target: { value: '18:00' } })
    await user.click(await screen.findByRole('button', { name: 'Batalkan perubahan' }))

    await waitFor(() => expect(screen.getByLabelText('Senin: jam tutup')).toHaveValue('17:00'))
  })

  it('shows an error with a retry that recovers', async () => {
    let fail = true
    server.use(
      http.get(`${API}/admin/business-hours`, () =>
        fail
          ? HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'x' } }, { status: 500 })
          : HttpResponse.json({ data: WEEK }),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<HoursPanel />)

    expect(await screen.findByText(/kesalahan pada server/)).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByLabelText('Senin: jam buka')).toBeInTheDocument()
  })
})
