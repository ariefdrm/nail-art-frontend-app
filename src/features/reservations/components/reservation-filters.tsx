import { useState } from 'react'

import { NativeSelect } from '@/components/common/native-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DEFAULT_RANGE_DAYS, hasActiveFilters } from '@/features/reservations/search'
import { STATUS_LABEL } from '@/lib/copy'
import { addDaysWib, todayWib } from '@/lib/format'
import { cn } from '@/lib/utils'

import { SearchBox } from './search-box'

import type { ReservationSearch } from '@/features/reservations/search'
import type { Artist, BookingStatus } from '@/lib/api/types'

const STATUSES = Object.keys(STATUS_LABEL) as BookingStatus[]

const CHIP =
  'inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

type ReservationFiltersProps = {
  search: ReservationSearch
  artists: Artist[] | undefined
  onChange: (next: ReservationSearch) => void
}

export function ReservationFilters({ search, artists, onChange }: ReservationFiltersProps) {
  // Bumped when a button changes the query from outside, so the search box shows the new value.
  const [resetKey, setResetKey] = useState(0)

  const today = todayWib()
  const tomorrow = addDaysWib(today, 1)

  /** Any filter change goes back to page 1 and closes the open panel. */
  function update(patch: ReservationSearch) {
    onChange({ ...search, ...patch, halaman: 1, id: undefined })
  }

  function replaceAll(next: ReservationSearch) {
    setResetKey((key) => key + 1)
    onChange({ ...next, halaman: 1 })
  }

  const shortcuts = [
    {
      label: 'Hari ini',
      isActive: search.dari === today && search.sampai === today && !search.status,
      apply: () => replaceAll({ dari: today, sampai: today }),
    },
    {
      label: 'Besok',
      isActive: search.dari === tomorrow && search.sampai === tomorrow && !search.status,
      apply: () => replaceAll({ dari: tomorrow, sampai: tomorrow }),
    },
    {
      label: '7 hari',
      isActive:
        search.dari === today &&
        search.sampai === addDaysWib(today, DEFAULT_RANGE_DAYS) &&
        !search.status,
      apply: () => replaceAll({ dari: today, sampai: addDaysWib(today, DEFAULT_RANGE_DAYS) }),
    },
    {
      label: 'Menunggu konfirmasi',
      isActive: search.status === 'pending' && !search.dari && !search.sampai,
      apply: () => replaceAll({ status: 'pending' }),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Pintasan">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            aria-pressed={shortcut.isActive}
            onClick={shortcut.apply}
            className={cn(
              CHIP,
              shortcut.isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background hover:bg-muted',
            )}
          >
            {shortcut.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <SearchBox
          key={resetKey}
          value={search.q ?? ''}
          onChange={(q) => update({ q: q || undefined })}
        />
        <Input
          type="date"
          aria-label="Dari tanggal"
          className="h-9"
          value={search.dari ?? ''}
          onChange={(event) => {
            const dari = event.target.value || undefined
            // A range that ends before it starts is refused by the API: keep it valid here.
            update({
              dari,
              sampai: dari && search.sampai && dari > search.sampai ? dari : search.sampai,
            })
          }}
        />
        <Input
          type="date"
          aria-label="Sampai tanggal"
          className="h-9"
          value={search.sampai ?? ''}
          onChange={(event) => {
            const sampai = event.target.value || undefined
            update({
              sampai,
              dari: sampai && search.dari && sampai < search.dari ? sampai : search.dari,
            })
          }}
        />
        <NativeSelect
          aria-label="Status"
          className="h-9"
          value={search.status ?? ''}
          onChange={(event) => {
            const value = STATUSES.find((status) => status === event.target.value)
            update({ status: value })
          }}
        >
          <option value="">Semua status</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Artist"
          className="h-9"
          value={search.artist ?? ''}
          onChange={(event) => update({ artist: event.target.value || undefined })}
        >
          <option value="">Semua artist</option>
          {artists?.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {hasActiveFilters(search) ? (
        <Button type="button" variant="link" size="sm" onClick={() => replaceAll({})}>
          Hapus filter
        </Button>
      ) : null}
    </div>
  )
}
