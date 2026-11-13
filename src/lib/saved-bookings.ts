import { z } from 'zod'

/**
 * Booking codes this browser has seen, so a customer who forgot theirs can pick it again.
 * Only the code and a label are kept: the phone number is never stored, and a code alone cannot
 * open a booking (lookup and cancel also need the phone). Not auth data.
 */
const STORAGE_KEY = 'np.bookings'
export const MAX_SAVED = 5

const savedSchema = z.array(
  z.object({
    code: z.string(),
    service_name: z.string(),
    start_at: z.string(),
  }),
)

export type SavedBooking = z.infer<typeof savedSchema>[number]

export function listSavedBookings(): SavedBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = savedSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

function write(items: SavedBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage blocked or full: the feature is a convenience, so it silently does nothing.
  }
}

/** Newest first, no duplicate codes, at most MAX_SAVED. Returns the new list. */
export function saveBooking(booking: SavedBooking): SavedBooking[] {
  const next = [booking, ...listSavedBookings().filter((item) => item.code !== booking.code)].slice(
    0,
    MAX_SAVED,
  )
  write(next)
  return next
}

export function removeSavedBooking(code: string): SavedBooking[] {
  const next = listSavedBookings().filter((item) => item.code !== code)
  write(next)
  return next
}
