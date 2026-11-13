import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import { FormField } from '@/components/common/form-field'
import { GuestFields } from '@/components/common/guest-fields'
import { NativeSelect } from '@/components/common/native-select'
import { SlotPicker } from '@/components/common/slot-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateReservationMutation } from '@/features/reservations/queries'
import {
  EMPTY_MANUAL,
  MANUAL_FIELDS,
  manualReservationSchema,
} from '@/features/reservations/schemas'
import { applyApiErrors, errorMessage, toApiError } from '@/lib/api/errors'
import { useArtistsQuery, useAvailabilityQuery, useServicesQuery } from '@/lib/api/public-queries'
import { ERROR_COPY } from '@/lib/copy'
import { formatDuration, formatRupiah, normalizePhone, todayWib } from '@/lib/format'

import type { ManualReservationValues } from '@/features/reservations/schemas'
import type { Booking } from '@/lib/api/types'

type ManualReservationFormProps = { onCreated: (booking: Booking) => void }

/** One compact form instead of the customer wizard's four steps: staff know what they are booking. */
export function ManualReservationForm({ onCreated }: ManualReservationFormProps) {
  const [notice, setNotice] = useState<string | null>(null)
  const form = useForm<ManualReservationValues>({
    resolver: zodResolver(manualReservationSchema),
    defaultValues: { ...EMPTY_MANUAL, date: todayWib() },
    mode: 'onTouched',
  })
  const { control, register, setValue, formState } = form
  const { errors } = formState

  const [serviceId, date, artistId, startAt, phone] = useWatch({
    control,
    name: ['service_id', 'date', 'artist_id', 'start_at', 'customer_phone'],
  })

  const services = useServicesQuery()
  const artists = useArtistsQuery()
  const availability = useAvailabilityQuery(
    serviceId && date
      ? { service_id: serviceId, date, artist_id: artistId || undefined }
      : undefined,
  )
  const create = useCreateReservationMutation()

  /** A different service, date or artist means the chosen time may no longer exist. */
  const clearSlot = { onChange: () => setValue('start_at', '') }

  async function submit(values: ManualReservationValues) {
    setNotice(null)
    try {
      const booking = await create.mutateAsync({
        service_id: values.service_id,
        start_at: values.start_at,
        artist_id: values.artist_id || undefined,
        customer_name: values.customer_name,
        customer_phone: normalizePhone(values.customer_phone) ?? values.customer_phone,
        customer_note: values.customer_note || undefined,
        reference_image_url: values.reference_image_url || undefined,
      })
      toast.success(`Reservasi ${booking.booking_code} dibuat`)
      onCreated(booking)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'SLOT_UNAVAILABLE') {
        setValue('start_at', '')
        setNotice(ERROR_COPY.slotUnavailable)
      } else if (apiError.status === 422) {
        applyApiErrors(form.setError, apiError, MANUAL_FIELDS)
      } else if (apiError.status === 404) {
        setNotice('Layanan atau artist yang dipilih sudah tidak tersedia. Silakan pilih ulang.')
      } else {
        setNotice(errorMessage(apiError))
      }
    }
  }

  const serverError = errors.root?.server?.message

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-4">
        {notice ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <FormField id="service_id" label="Layanan" error={errors.service_id?.message}>
          {(field) => (
            <NativeSelect {...field} {...register('service_id', clearSlot)}>
              <option value="">Pilih layanan</option>
              {services.data?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}, {formatDuration(service.duration_minutes)},{' '}
                  {formatRupiah(service.price)}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>

        {services.isError ? (
          <ErrorState error={services.error} onRetry={() => void services.refetch()} />
        ) : null}

        <FormField id="date" label="Tanggal" error={errors.date?.message}>
          {(field) => (
            <Input {...field} type="date" min={todayWib()} {...register('date', clearSlot)} />
          )}
        </FormField>

        <section aria-labelledby="slot-heading" className="space-y-2" aria-live="polite">
          <h3 id="slot-heading" className="text-sm font-medium">
            Jam tersedia
          </h3>
          {serviceId && date ? (
            <SlotPicker
              slots={availability.data}
              isPending={availability.isPending}
              error={availability.error}
              selected={startAt || undefined}
              onSelect={(value) => setValue('start_at', value, { shouldValidate: true })}
              onRetry={() => void availability.refetch()}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Pilih layanan dan tanggal dulu.</p>
          )}
          {errors.start_at ? (
            <p role="alert" className="flex items-start gap-1.5 text-sm font-medium">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {errors.start_at.message}
            </p>
          ) : null}
        </section>

        <FormField
          id="artist_id"
          label="Artist"
          hint={
            artists.isError
              ? 'Daftar artist tidak dapat dimuat. Sistem akan memilihkan artist yang kosong.'
              : 'Kosongkan agar sistem memilihkan artist yang kosong.'
          }
          error={errors.artist_id?.message}
        >
          {(field) => (
            <NativeSelect {...field} {...register('artist_id', clearSlot)}>
              <option value="">Ditentukan sistem</option>
              {artists.data?.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>

        <GuestFields
          register={(name) => register(name)}
          errors={errors}
          phone={phone}
          className="space-y-6"
        />

        {serverError ? (
          <p role="alert" className="text-sm font-medium">
            {serverError}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border p-6">
        <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
          {create.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {create.isPending ? 'Membuat...' : 'Buat reservasi'}
        </Button>
      </div>
    </form>
  )
}
