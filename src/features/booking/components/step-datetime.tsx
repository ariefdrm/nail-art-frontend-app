import { useState } from 'react'
import { id as idLocale } from 'react-day-picker/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { useArtistsQuery, useAvailabilityQuery } from '@/features/booking/queries'
import {
  formatDate,
  formatDuration,
  formatRupiah,
  maxBookingDateWib,
  parseDay,
  todayWib,
  toDayKey,
} from '@/lib/format'
import { cn } from '@/lib/utils'

import { SlotPicker } from './slot-picker'

import type { Service } from '@/lib/api/types'

type StepDatetimeProps = {
  service: Service
  date: string | undefined
  slot: string | undefined
  artistId: string | undefined
  onChangeService: () => void
  onDate: (date: string) => void
  onSlot: (startAt: string) => void
  onArtist: (artistId: string | undefined) => void
}

export function StepDatetime({
  service,
  date,
  slot,
  artistId,
  onChangeService,
  onDate,
  onSlot,
  onArtist,
}: StepDatetimeProps) {
  const [isChoosingArtist, setIsChoosingArtist] = useState(artistId !== undefined)
  const artists = useArtistsQuery(isChoosingArtist)
  const availability = useAvailabilityQuery(
    date && service.id ? { service_id: service.id, date, artist_id: artistId } : undefined,
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <p className="font-medium">
          {service.name}
          <span className="font-normal text-muted-foreground tabular-nums">
            {' '}
            {formatDuration(service.duration_minutes)}, {formatRupiah(service.price)}
          </span>
        </p>
        <Button type="button" variant="link" size="sm" onClick={onChangeService}>
          Ubah
        </Button>
      </div>

      <section aria-labelledby="date-title" className="space-y-3">
        <h2 id="date-title" className="text-sm font-medium">
          Tanggal
        </h2>
        <Calendar
          mode="single"
          locale={idLocale}
          selected={date ? parseDay(date) : undefined}
          onSelect={(picked) => {
            if (picked) onDate(toDayKey(picked))
          }}
          disabled={{ before: parseDay(todayWib()), after: parseDay(maxBookingDateWib()) }}
          startMonth={parseDay(todayWib())}
          endMonth={parseDay(maxBookingDateWib())}
          className="w-full rounded-lg border border-border"
        />
      </section>

      <section aria-labelledby="slot-title" className="space-y-3" aria-live="polite">
        <h2 id="slot-title" className="text-sm font-medium">
          {date ? `Jam tersedia, ${formatDate(parseDay(date))}` : 'Jam tersedia'}
        </h2>
        {date ? (
          <SlotPicker
            slots={availability.data}
            isPending={availability.isPending}
            error={availability.error}
            selected={slot}
            onSelect={onSlot}
            onRetry={() => void availability.refetch()}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Pilih tanggal untuk melihat jam yang kosong.
          </p>
        )}
      </section>

      <section aria-labelledby="artist-title" className="space-y-3">
        {isChoosingArtist ? (
          <>
            <h2 id="artist-title" className="text-sm font-medium">
              Artist
            </h2>
            <div role="group" aria-labelledby="artist-title" className="flex flex-wrap gap-2">
              {[{ id: undefined, name: 'Tanpa preferensi' }, ...(artists.data ?? [])].map(
                (artist) => (
                  <button
                    key={artist.id ?? 'any'}
                    type="button"
                    aria-pressed={artist.id === artistId}
                    onClick={() => onArtist(artist.id)}
                    className={cn(
                      'inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium outline-none',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      artist.id === artistId
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:bg-muted',
                    )}
                  >
                    {artist.name}
                  </button>
                ),
              )}
            </div>
            {artists.isPending ? (
              <p className="text-sm text-muted-foreground">Memuat artist...</p>
            ) : null}
            {artists.isError ? (
              <p role="alert" className="text-sm font-medium">
                Daftar artist tidak dapat dimuat. Studio akan memilihkan artist untuk Anda.
              </p>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsChoosingArtist(true)}
            className="min-h-11 text-sm font-medium underline-offset-4 hover:underline"
          >
            Pilih artist (opsional)
          </button>
        )}
      </section>
    </div>
  )
}
