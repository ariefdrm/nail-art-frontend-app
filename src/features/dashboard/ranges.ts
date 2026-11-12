import { addMonths, daysBetween, endOfMonth, startOfMonth } from '@/lib/calendar-days'
import { addDaysWib } from '@/lib/format'

import type { SummaryRange } from './api'

export type Preset = '7-hari' | '30-hari' | 'bulan-ini' | 'bulan-lalu' | 'kustom'

export const PRESET_LABEL: Record<Preset, string> = {
  '7-hari': '7 hari',
  '30-hari': '30 hari',
  'bulan-ini': 'Bulan ini',
  'bulan-lalu': 'Bulan lalu',
  kustom: 'Kustom',
}

/** The API refuses longer ranges (docs/API_GUIDE.md section 7.6). */
export const MAX_RANGE_DAYS = 366

/** The dates a preset stands for. "7 hari" is the last seven days up to and including today. */
export function presetRange(preset: Exclude<Preset, 'kustom'>, today: string): SummaryRange {
  switch (preset) {
    case '7-hari':
      return { dari: addDaysWib(today, -6), sampai: today }
    case '30-hari':
      return { dari: addDaysWib(today, -29), sampai: today }
    case 'bulan-ini':
      return { dari: startOfMonth(today), sampai: endOfMonth(today) }
    case 'bulan-lalu': {
      const lastMonth = addMonths(today, -1)
      return { dari: startOfMonth(lastMonth), sampai: endOfMonth(lastMonth) }
    }
  }
}

const PRESETS = ['7-hari', '30-hari', 'bulan-ini', 'bulan-lalu'] as const

/** Which preset the dates match, or "kustom" when none does. */
export function activePreset(range: SummaryRange, today: string): Preset {
  return (
    PRESETS.find((preset) => {
      const candidate = presetRange(preset, today)
      return candidate.dari === range.dari && candidate.sampai === range.sampai
    }) ?? 'kustom'
  )
}

/** A message when the range cannot be asked for, otherwise null. */
export function rangeProblem(range: SummaryRange): string | null {
  if (range.sampai < range.dari) return 'Tanggal akhir tidak boleh sebelum tanggal awal.'
  if (daysBetween(range.dari, range.sampai) + 1 > MAX_RANGE_DAYS) {
    return `Rentang maksimal ${MAX_RANGE_DAYS} hari.`
  }
  return null
}
