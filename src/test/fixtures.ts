import type { Booking } from '@/lib/api/types'

export const SERVICE = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Gel Polish',
  description: null,
  category: 'gel_polish',
  price: 150000,
  duration_minutes: 90,
  image_url: null,
  is_active: true,
}

export const ARTIST = {
  id: '55555555-5555-4555-8555-555555555555',
  name: 'Owner',
  photo_url: null,
  is_active: true,
}

/** A complete booking as the admin API returns it; override what a test cares about. */
export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    booking_code: 'NP-20261112-A7K2',
    status: 'pending',
    service: SERVICE,
    artist: ARTIST,
    start_at: '2099-11-12T10:00:00+07:00',
    end_at: '2099-11-12T11:30:00+07:00',
    customer_name: 'Siti Rahayu',
    customer_phone: '+6281234567890',
    customer_note: null,
    reference_image_url: null,
    total_price: 150000,
    source: 'online',
    cancel_reason: null,
    admin_note: null,
    reminder_url: 'https://wa.me/6281234567890?text=Halo',
    schedule_conflict: false,
    created_at: '2026-11-08T08:00:00+07:00',
    updated_at: '2026-11-08T08:00:00+07:00',
    ...overrides,
  }
}
