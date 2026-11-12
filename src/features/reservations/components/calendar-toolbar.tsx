import { ChevronLeft, ChevronRight } from 'lucide-react'

import { SegmentedControl } from '@/components/common/segmented-control'
import { Button } from '@/components/ui/button'

import type { CalendarScale } from '@/features/reservations/search'

type CalendarToolbarProps = {
  label: string
  scale: CalendarScale
  onScaleChange: (scale: CalendarScale) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarToolbar({
  label,
  scale,
  onScaleChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  const unit = scale === 'minggu' ? 'Minggu' : 'Bulan'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label={`${unit} sebelumnya`}
          onClick={onPrevious}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label={`${unit} berikutnya`}
          onClick={onNext}
        >
          <ChevronRight aria-hidden />
        </Button>
        <Button type="button" variant="outline" onClick={onToday}>
          Hari ini
        </Button>
        <h2 className="ml-1 text-lg font-semibold tabular-nums" aria-live="polite">
          {label}
        </h2>
      </div>
      <SegmentedControl<CalendarScale>
        label="Skala kalender"
        value={scale}
        onChange={onScaleChange}
        options={[
          { value: 'minggu', label: 'Minggu' },
          { value: 'bulan', label: 'Bulan' },
        ]}
      />
    </div>
  )
}
