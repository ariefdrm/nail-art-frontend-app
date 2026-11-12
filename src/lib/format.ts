import { ENV } from '@/lib/env'

const TIME_ZONE = 'Asia/Jakarta'
const LOCALE = 'id-ID'
const DAY_MS = 86_400_000

const rupiah = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const dateLong = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const dateShort = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dayShort = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
// en-CA yields YYYY-MM-DD, which is the shape the API wants for calendar days.
const isoDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

type DateInput = string | Date

function toDate(value: DateInput): Date {
  return typeof value === 'string' ? new Date(value) : value
}

/** "Rp150.000" */
export function formatRupiah(amount: number): string {
  return rupiah.format(amount).replaceAll(String.fromCharCode(160), '')
}

/** "Selasa, 10 November 2026" */
export function formatDate(value: DateInput): string {
  return dateLong.format(toDate(value))
}

/** "10 Nov 2026" */
export function formatDateShort(value: DateInput): string {
  return dateShort.format(toDate(value))
}

/** "10.00" (24 hour, dot separator) */
export function formatTime(value: DateInput): string {
  return timeFormat.format(toDate(value)).replace(':', '.')
}

/** "Selasa, 10 November 2026, 10.00" */
export function formatDateTime(value: DateInput): string {
  return `${formatDate(value)}, ${formatTime(value)}`
}

/** The WIB calendar day of an instant, as YYYY-MM-DD. */
export function toWibDateString(value: DateInput): string {
  return isoDay.format(toDate(value))
}

export function todayWib(): string {
  return toWibDateString(new Date())
}

/** Adds whole days to a YYYY-MM-DD string (calendar arithmetic, no timezone involved). */
export function addDaysWib(day: string, days: number): string {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, date) + days * DAY_MS)
  return shifted.toISOString().slice(0, 10)
}

/** Last day a customer may book; must equal the backend's MAX_ADVANCE_DAYS. */
export function maxBookingDateWib(): string {
  return addDaysWib(todayWib(), ENV.VITE_MAX_ADVANCE_DAYS)
}

/** Normalizes 08..., 62... and +62... to E.164 (+62...). Returns null when it is not a mobile number. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-.()]/g, '')
  if (!/^\+?\d+$/.test(digits)) return null
  let national: string
  if (digits.startsWith('+62')) national = digits.slice(3)
  else if (digits.startsWith('62')) national = digits.slice(2)
  else if (digits.startsWith('0')) national = digits.slice(1)
  else return null
  if (!/^8\d{8,11}$/.test(national)) return null
  return `+62${national}`
}

/** "+62 812-3456-7890"; falls back to the input when it cannot be normalized. */
export function formatPhone(input: string): string {
  const e164 = normalizePhone(input)
  if (!e164) return input
  const national = e164.slice(3)
  return `+62 ${national.slice(0, 3)}-${national.slice(3, 7)}-${national.slice(7)}`
}

/** "1 j 30 mnt", "2 j", "45 mnt" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours > 0 ? `${hours} j` : '', rest > 0 ? `${rest} mnt` : ''].filter(Boolean).join(' ')
}

/** "gel_polish" -> "Gel polish" */
export function formatCategory(category: string): string {
  const text = category.replaceAll('_', ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "2026-11-10" -> a Date at local midnight, for calendar widgets that work in local days. */
export function parseDay(day: string): Date {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
}

/** A calendar widget's local day -> "2026-11-10". Inverse of parseDay. */
export function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** "Sel, 10 Nov" */
export function formatDayShort(value: DateInput): string {
  return dayShort.format(toDate(value))
}

/** True once the instant has passed (e.g. a booking's start). */
export function hasStarted(value: DateInput): boolean {
  return toDate(value).getTime() <= Date.now()
}
