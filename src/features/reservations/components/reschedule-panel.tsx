import { Info, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { FormField } from '@/components/common/form-field'
import { NativeSelect } from '@/components/common/native-select'
import { SlotPicker } from '@/components/common/slot-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useArtistsQuery, useAvailabilityQuery, useServicesQuery } from '@/lib/api/public-queries'
import { todayWib, toWibDateString } from '@/lib/format'

import type { UpdateReservationInput } from '@/features/reservations/api'
import type { Booking } from '@/lib/api/types'

type ReschedulePanelProps = {
  booking: Booking
  isPending: boolean
  onSave: (input: UpdateReservationInput) => void
}

export function ReschedulePanel({ booking, isPending, onSave }: ReschedulePanelProps) {
  const [date, setDate] = useState(() => toWibDateString(booking.start_at))
  const [serviceId, setServiceId] = useState(booking.service.id)
  const [artistId, setArtistId] = useState(booking.artist.id)
  const [slot, setSlot] = useState<string | undefined>()

  const services = useServicesQuery()
  const artists = useArtistsQuery()
  const availability = useAvailabilityQuery(
    date ? { service_id: serviceId, date, artist_id: artistId } : undefined,
  )

  const serviceChanged = serviceId !== booking.service.id
  const artistChanged = artistId !== booking.artist.id
  const canSave = (slot !== undefined || serviceChanged || artistChanged) && !isPending

  return (
    <form
      className="space-y-4 rounded-lg border border-border p-4"
      aria-label="Jadwalkan ulang"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          ...(slot ? { start_at: slot } : {}),
          ...(artistChanged ? { artist_id: artistId } : {}),
          ...(serviceChanged ? { service_id: serviceId } : {}),
        })
      }}
    >
      <h3 className="text-sm font-semibold">Jadwalkan ulang</h3>

      {services.isError || artists.isError ? (
        <p role="status" className="text-sm text-muted-foreground">
          Daftar layanan atau artist tidak dapat dimuat penuh, jadi pilihan di bawah mungkin
          terbatas.
        </p>
      ) : null}

      <FormField id="resched-service" label="Layanan">
        {(control) => (
          <NativeSelect
            {...control}
            className="h-9"
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value)
              setSlot(undefined)
            }}
          >
            {services.data?.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
            {services.data?.some((service) => service.id === booking.service.id) ? null : (
              <option value={booking.service.id}>{booking.service.name}</option>
            )}
          </NativeSelect>
        )}
      </FormField>
      {serviceChanged ? (
        <Alert>
          <Info aria-hidden />
          <AlertDescription>Harga akan mengikuti layanan baru.</AlertDescription>
        </Alert>
      ) : null}

      <FormField id="resched-artist" label="Artist">
        {(control) => (
          <NativeSelect
            {...control}
            className="h-9"
            value={artistId}
            onChange={(event) => {
              setArtistId(event.target.value)
              setSlot(undefined)
            }}
          >
            {artists.data?.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
            {artists.data?.some((artist) => artist.id === booking.artist.id) ? null : (
              <option value={booking.artist.id}>{booking.artist.name}</option>
            )}
          </NativeSelect>
        )}
      </FormField>

      <FormField
        id="resched-date"
        label="Tanggal"
        hint="Jam reservasi ini sendiri mungkin tidak tampil sebagai tersedia."
      >
        {(control) => (
          <Input
            {...control}
            type="date"
            className="h-9"
            min={todayWib()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value || todayWib())
              setSlot(undefined)
            }}
          />
        )}
      </FormField>

      <div className="space-y-2" aria-live="polite">
        <p className="text-sm font-medium">Jam tersedia</p>
        <SlotPicker
          slots={availability.data}
          isPending={availability.isPending}
          error={availability.error}
          selected={slot}
          onSelect={setSlot}
          onRetry={() => void availability.refetch()}
        />
      </div>

      <Button type="submit" disabled={!canSave}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Simpan jadwal baru
      </Button>
    </form>
  )
}
