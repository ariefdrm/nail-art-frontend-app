import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithRouter } from '@/test/render-with-router'

import { BookingSuccess } from './booking-success'

describe('BookingSuccess', () => {
  it('shows the booking code, status and the next step', async () => {
    await renderWithRouter(
      <BookingSuccess
        booking={{
          booking_code: 'NP-20261112-A7K2',
          status: 'pending',
          service_name: 'Gel Polish',
          artist_name: 'Owner',
          start_at: '2026-11-12T10:00:00+07:00',
          end_at: '2026-11-12T11:30:00+07:00',
          total_price: 150000,
        }}
      />,
    )
    expect(screen.getByText('NP-20261112-A7K2')).toBeInTheDocument()
    expect(screen.getByText('Menunggu konfirmasi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salin' })).toBeInTheDocument()
    expect(screen.getByText(/Rp150\.000/)).toBeInTheDocument()
  })

  it('points to the lookup page when there is nothing to show (page reloaded)', async () => {
    await renderWithRouter(<BookingSuccess booking={undefined} />)
    expect(screen.getByText('Tidak ada pemesanan untuk ditampilkan')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cek status pesanan' })).toBeInTheDocument()
  })
})
