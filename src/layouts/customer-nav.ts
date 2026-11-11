/** Single source for the customer navigation; header, menu and footer all read it. */
export const NAV_ITEMS = [
  { to: '/layanan', label: 'Layanan' },
  { to: '/cek-booking', label: 'Cek booking' },
] as const

export const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'
export const MAIN_ID = 'konten'
