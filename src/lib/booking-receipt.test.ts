import { describe, expect, it } from 'vitest'

import { receiptFileName, receiptRows } from './booking-receipt'

describe('booking receipt', () => {
  it('names the file after the booking code', () => {
    expect(receiptFileName('NP-20261112-A7K2')).toBe('bukti-booking-np-20261112-a7k2.png')
  })

  it('lists status, service, schedule, artist and total in Indonesian', () => {
    const rows = receiptRows({
      booking_code: 'NP-20261112-A7K2',
      status: 'pending',
      service_name: 'Gel Polish',
      artist_name: 'Owner',
      start_at: '2026-11-12T10:00:00+07:00',
      end_at: '2026-11-12T11:30:00+07:00',
      total_price: 150000,
    })
    expect(rows.map((row) => row.label)).toEqual(['Status', 'Layanan', 'Jadwal', 'Artist', 'Total'])
    expect(rows[0]?.value).toBe('Menunggu konfirmasi')
    expect(rows[2]?.value).toContain('10.00 - 11.30 WIB')
    expect(rows[4]?.value).toMatch(/Rp\s?150\.000/)
  })
})
