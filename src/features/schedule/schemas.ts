import { z } from 'zod'

import { addDaysWib } from '@/lib/format'

import type { BlockInput } from './api'
import type { BusinessHour } from '@/lib/api/types'

// ---------------------------------------------------------------------------------------------
// Business hours
// ---------------------------------------------------------------------------------------------

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

/** The week is shown from Monday; the data keeps the API's order (0 = Sunday), so index = day. */
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export const dayHoursSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    is_open: z.boolean(),
    open_time: z.string(),
    close_time: z.string(),
    break_start: z.string(),
    break_end: z.string(),
  })
  .superRefine((day, ctx) => {
    if (!day.is_open) return // a closed day carries no times
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })

    if (!TIME.test(day.open_time)) issue('open_time', 'Jam buka wajib diisi')
    if (!TIME.test(day.close_time)) issue('close_time', 'Jam tutup wajib diisi')
    if (TIME.test(day.open_time) && TIME.test(day.close_time) && day.open_time >= day.close_time) {
      issue('close_time', 'Jam tutup harus setelah jam buka')
    }

    const hasStart = day.break_start !== ''
    const hasEnd = day.break_end !== ''
    if (hasStart !== hasEnd) {
      issue(
        hasStart ? 'break_end' : 'break_start',
        'Isi mulai dan selesai istirahat, atau kosongkan keduanya',
      )
      return
    }
    if (!hasStart) return
    if (!TIME.test(day.break_start)) issue('break_start', 'Jam istirahat tidak valid')
    if (!TIME.test(day.break_end)) issue('break_end', 'Jam istirahat tidak valid')
    if (day.break_start >= day.break_end) {
      issue('break_end', 'Selesai istirahat harus setelah mulai')
    } else if (
      TIME.test(day.open_time) &&
      TIME.test(day.close_time) &&
      (day.break_start < day.open_time || day.break_end > day.close_time)
    ) {
      issue('break_start', 'Istirahat harus berada di dalam jam buka')
    }
  })

export const hoursFormSchema = z.object({ days: z.array(dayHoursSchema).length(7) })

export type DayHoursValues = z.infer<typeof dayHoursSchema>
export type HoursFormValues = z.infer<typeof hoursFormSchema>

const EMPTY_DAY = { is_open: false, open_time: '', close_time: '', break_start: '', break_end: '' }

/** The API's rows -> seven form days, index = day_of_week. Times arrive as HH:mm (seconds cut off). */
export function toHoursFormValues(rows: BusinessHour[]): HoursFormValues {
  const days: DayHoursValues[] = Array.from({ length: 7 }, (_, day) => {
    const row = rows.find((candidate) => candidate.day_of_week === day)
    return {
      day_of_week: day,
      ...EMPTY_DAY,
      ...(row?.is_open
        ? {
            is_open: true,
            open_time: row.open_time?.slice(0, 5) ?? '',
            close_time: row.close_time?.slice(0, 5) ?? '',
            break_start: row.break_start?.slice(0, 5) ?? '',
            break_end: row.break_end?.slice(0, 5) ?? '',
          }
        : {}),
    }
  })
  return { days }
}

/** Form -> request: exactly seven days; closed days carry no times, breaks only when paired. */
export function toBusinessHours(values: HoursFormValues): BusinessHour[] {
  return values.days.map((day) =>
    day.is_open
      ? {
          day_of_week: day.day_of_week,
          is_open: true,
          open_time: day.open_time,
          close_time: day.close_time,
          ...(day.break_start && day.break_end
            ? { break_start: day.break_start, break_end: day.break_end }
            : {}),
        }
      : { day_of_week: day.day_of_week, is_open: false },
  )
}

const HOURS_FIELD = /hours(?:\[|\.)(\d+)\]?\.(open_time|close_time|break_start|break_end|is_open)/

/** Reads a server field path such as "hours.2.open_time" into the day and field it points at. */
export function parseHoursField(field: string): {
  day: number
  field: 'open_time' | 'close_time' | 'break_start' | 'break_end' | 'is_open'
} | null {
  const match = HOURS_FIELD.exec(field)
  if (!match) return null
  const day = Number(match[1])
  const name = match[2]
  if (day < 0 || day > 6) return null
  if (
    name === 'open_time' ||
    name === 'close_time' ||
    name === 'break_start' ||
    name === 'break_end' ||
    name === 'is_open'
  ) {
    return { day, field: name }
  }
  return null
}

// ---------------------------------------------------------------------------------------------
// Blocked time
// ---------------------------------------------------------------------------------------------

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/
export const MAX_BLOCK_DAYS = 366
export const MAX_BLOCK_REASON = 255

export const blockFormSchema = z
  .object({
    /** Empty means the whole studio; otherwise an artist id. */
    scope: z.string(),
    start_date: z.string().regex(DAY_KEY, 'Pilih tanggal mulai'),
    start_time: z.string().regex(TIME, 'Isi jam mulai'),
    end_date: z.string().regex(DAY_KEY, 'Pilih tanggal selesai'),
    end_time: z.string().regex(TIME, 'Isi jam selesai'),
    reason: z.string().trim().max(MAX_BLOCK_REASON, `Alasan maksimal ${MAX_BLOCK_REASON} huruf`),
  })
  .superRefine((block, ctx) => {
    if (!DAY_KEY.test(block.start_date) || !TIME.test(block.start_time)) return
    if (!DAY_KEY.test(block.end_date) || !TIME.test(block.end_time)) return
    // WIB wall-clock strings sort the same as the instants they name.
    const start = `${block.start_date}T${block.start_time}`
    const end = `${block.end_date}T${block.end_time}`
    if (end <= start) {
      ctx.addIssue({ code: 'custom', path: ['end_time'], message: 'Selesai harus setelah mulai' })
    } else if (end > `${addDaysWib(block.start_date, MAX_BLOCK_DAYS)}T${block.start_time}`) {
      ctx.addIssue({
        code: 'custom',
        path: ['end_date'],
        message: `Rentang blokir maksimal ${MAX_BLOCK_DAYS} hari`,
      })
    }
  })

export type BlockFormValues = z.infer<typeof blockFormSchema>

/** Local wall-clock date and time -> the +07:00 instant the API wants. */
export function toWibInstant(date: string, time: string): string {
  return `${date}T${time}:00+07:00`
}

export function toBlockInput(values: BlockFormValues): BlockInput {
  return {
    start_at: toWibInstant(values.start_date, values.start_time),
    end_at: toWibInstant(values.end_date, values.end_time),
    artist_id: values.scope || undefined,
    reason: values.reason || undefined,
  }
}

export const BLOCK_FIELDS = ['artist_id', 'start_at', 'end_at', 'reason'] as const
