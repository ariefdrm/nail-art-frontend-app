import { useCallback, useState } from 'react'

import { listSavedBookings, removeSavedBooking, saveBooking } from '@/lib/saved-bookings'

import type { SavedBooking } from '@/lib/saved-bookings'

export function useSavedBookings() {
  const [items, setItems] = useState<SavedBooking[]>(listSavedBookings)
  const add = useCallback((booking: SavedBooking) => setItems(saveBooking(booking)), [])
  const remove = useCallback((code: string) => setItems(removeSavedBooking(code)), [])
  return { items, add, remove }
}
