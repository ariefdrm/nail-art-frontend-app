import type { BookingStatus } from './api/types'

/** Booking status labels (DESIGN_SPEC.md section 6). */
export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Menunggu konfirmasi',
  confirmed: 'Terkonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak hadir',
}

/** Messages per error situation (PRD section 8). */
export const ERROR_COPY = {
  network: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
  unauthorized: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
  badCredentials: 'Email atau kata sandi salah.',
  originNotAllowed:
    'Aplikasi ini belum diizinkan oleh server (pengaturan CORS_ORIGINS). Hubungi pengelola sistem.',
  forbidden: 'Anda tidak memiliki akses ke fitur ini.',
  notFound: 'Data tidak ditemukan.',
  slotUnavailable: 'Jadwal tersebut baru saja terisi atau tidak tersedia. Silakan pilih jam lain.',
  blockHasBookings: 'Ada reservasi pada rentang waktu tersebut.',
  validation: 'Data yang Anda isi belum sesuai. Periksa kembali.',
  tooLarge: 'Data yang dikirim terlalu besar.',
  server: 'Terjadi kesalahan pada server. Coba lagi sebentar lagi.',
  unknown: 'Terjadi kesalahan. Coba lagi.',
} as const

export function rateLimitedMessage(retryAfter: number | undefined): string {
  return retryAfter === undefined
    ? 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.'
    : `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`
}
