import type { BookingConfirmation } from './api'

// What /pesan/berhasil shows. It travels in the browser history entry, not in web storage:
// booking codes and phone numbers must not be stored by customer pages (PRD section 9).
declare module '@tanstack/history' {
  interface HistoryState {
    booking?: BookingConfirmation
  }
}
