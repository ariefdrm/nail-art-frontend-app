import { addDaysWib } from './format'

/**
 * Calendar arithmetic on plain YYYY-MM-DD days (WIB calendar days). No Date objects leak out, so
 * nothing here depends on the browser's timezone. Weeks start on Monday.
 */

function parts(day: string): [number, number, number] {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number)
  return [year, month, date]
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** 0 = Monday ... 6 = Sunday */
export function weekdayIndex(day: string): number {
  const [year, month, date] = parts(day)
  return (new Date(Date.UTC(year, month - 1, date)).getUTCDay() + 6) % 7
}

export function startOfWeek(day: string): string {
  return addDaysWib(day, -weekdayIndex(day))
}

export function endOfWeek(day: string): string {
  return addDaysWib(startOfWeek(day), 6)
}

export function weekDays(day: string): string[] {
  const first = startOfWeek(day)
  return Array.from({ length: 7 }, (_, offset) => addDaysWib(first, offset))
}

export function startOfMonth(day: string): string {
  const [year, month] = parts(day)
  return `${year}-${pad(month)}-01`
}

export function endOfMonth(day: string): string {
  const [year, month] = parts(day)
  return `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`
}

/** Moves by whole months, keeping the day of month where it exists (31 Jan + 1 = 28/29 Feb). */
export function addMonths(day: string, months: number): string {
  const [year, month, date] = parts(day)
  const total = year * 12 + (month - 1) + months
  const nextYear = Math.floor(total / 12)
  const nextMonth = (total % 12) + 1
  const nextDate = Math.min(date, daysInMonth(nextYear, nextMonth))
  return `${nextYear}-${pad(nextMonth)}-${pad(nextDate)}`
}

/** The weeks (Monday first) that cover the month of `day`, including spill-over days. */
export function monthGrid(day: string): string[][] {
  const last = endOfWeek(endOfMonth(day))
  const weeks: string[][] = []
  for (
    let cursor = startOfWeek(startOfMonth(day));
    cursor <= last;
    cursor = addDaysWib(cursor, 7)
  ) {
    weeks.push(weekDays(cursor))
  }
  return weeks
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = parts(from)
  const [ty, tm, td] = parts(to)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}
