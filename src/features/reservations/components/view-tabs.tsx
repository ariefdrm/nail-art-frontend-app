import { CalendarDays, List } from 'lucide-react'

import { SegmentedControl } from '@/components/common/segmented-control'
import { defaultRange, isCalendar } from '@/features/reservations/search'

import type { ReservationSearch } from '@/features/reservations/search'

type View = 'daftar' | 'kalender'

type ViewTabsProps = { search: ReservationSearch; onChange: (next: ReservationSearch) => void }

export function ViewTabs({ search, onChange }: ViewTabsProps) {
  const current: View = isCalendar(search) ? 'kalender' : 'daftar'

  function select(view: View) {
    if (view === current) return
    if (view === 'kalender') {
      // The calendar picks its own dates; open it on the week the list was looking at.
      onChange({
        ...search,
        tampilan: 'kalender',
        tanggal: search.dari,
        dari: undefined,
        sampai: undefined,
        halaman: undefined,
      })
      return
    }
    onChange({
      ...search,
      tampilan: undefined,
      skala: undefined,
      tanggal: undefined,
      // Back in the list, an unbounded date range would be every reservation ever: start sensibly.
      ...(search.dari || search.sampai ? {} : defaultRange()),
      halaman: undefined,
    })
  }

  return (
    <SegmentedControl<View>
      label="Tampilan"
      value={current}
      onChange={select}
      options={[
        { value: 'daftar', label: 'Daftar', icon: <List className="size-4" aria-hidden /> },
        {
          value: 'kalender',
          label: 'Kalender',
          icon: <CalendarDays className="size-4" aria-hidden />,
        },
      ]}
    />
  )
}
