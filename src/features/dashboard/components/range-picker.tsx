import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import { PRESET_LABEL, activePreset, presetRange } from '@/features/dashboard/ranges'
import { todayWib } from '@/lib/format'

import type { SummaryRange } from '@/features/dashboard/api'
import type { Preset } from '@/features/dashboard/ranges'

const OPTIONS = (Object.keys(PRESET_LABEL) as Preset[]).map((value) => ({
  value,
  label: PRESET_LABEL[value],
}))

type RangePickerProps = {
  range: SummaryRange
  onChange: (range: SummaryRange) => void
}

export function RangePicker({ range, onChange }: RangePickerProps) {
  const today = todayWib()
  const current = activePreset(range, today)

  return (
    <div className="space-y-3">
      <SegmentedControl<Preset>
        label="Rentang waktu"
        value={current}
        options={OPTIONS}
        className="flex-wrap"
        onChange={(preset) => {
          // "Kustom" keeps the dates on screen and lets the pickers below take over.
          if (preset !== 'kustom') onChange(presetRange(preset, today))
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          aria-label="Dari tanggal"
          className="h-9 w-auto"
          value={range.dari}
          onChange={(event) => {
            if (event.target.value) onChange({ ...range, dari: event.target.value })
          }}
        />
        <span aria-hidden>-</span>
        <Input
          type="date"
          aria-label="Sampai tanggal"
          className="h-9 w-auto"
          value={range.sampai}
          onChange={(event) => {
            if (event.target.value) onChange({ ...range, sampai: event.target.value })
          }}
        />
      </div>
    </div>
  )
}
