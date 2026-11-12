import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCreateBookingMutation } from '@/features/booking/queries'
import { EMPTY_GUEST, GUEST_FIELDS, guestSchema } from '@/features/booking/schemas'
import { useCountdown } from '@/hooks/use-countdown'
import { applyApiErrors, errorMessage, toApiError } from '@/lib/api/errors'
import { useArtistsQuery } from '@/lib/api/public-queries'
import { ERROR_COPY, rateLimitedMessage } from '@/lib/copy'
import { normalizePhone } from '@/lib/format'

import { StepDatetime } from './step-datetime'
import { StepGuest } from './step-guest'
import { StepReview } from './step-review'
import { StepService } from './step-service'
import { WizardProgress } from './wizard-progress'

import type { ServicesState } from './step-service'
import type { BookingConfirmation } from '@/features/booking/api'
import type { GuestValues } from '@/features/booking/schemas'
import type { Service } from '@/lib/api/types'

/** Everything the URL carries. Guest details stay out of it: phone numbers do not belong in URLs. */
export type BookingSearch = {
  langkah?: number | undefined
  layanan?: string | undefined
  tanggal?: string | undefined
  jam?: string | undefined
  artist?: string | undefined
}

const TOTAL_STEPS = 4
const TITLES = [
  'Pilih layanan',
  'Pilih tanggal dan jam',
  'Isi data Anda',
  'Tinjau dan kirim',
] as const

type BookingWizardProps = {
  search: BookingSearch
  onSearchChange: (next: BookingSearch) => void
  services: ServicesState
  onBooked: (confirmation: BookingConfirmation) => void
  onCancel: () => void
}

export function BookingWizard({
  search,
  onSearchChange,
  services,
  onBooked,
  onCancel,
}: BookingWizardProps) {
  const [guest, setGuest] = useState<GuestValues | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { secondsLeft, start: startCountdown } = useCountdown()

  const form = useForm<GuestValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: EMPTY_GUEST,
    mode: 'onTouched',
  })
  const mutation = useCreateBookingMutation()
  const artists = useArtistsQuery(search.artist !== undefined)

  const service = services.services?.find((candidate) => candidate.id === search.layanan)
  const hasSlot = search.tanggal !== undefined && search.jam !== undefined
  const maxStep = !service ? 1 : !hasSlot ? 2 : !guest ? 3 : 4
  const requested = search.langkah ?? (search.layanan ? 2 : 1)
  const step = Math.min(Math.max(requested, 1), maxStep)
  const artistName = artists.data?.find((artist) => artist.id === search.artist)?.name

  function go(next: BookingSearch) {
    setNotice(null)
    onSearchChange({ ...search, ...next })
  }

  function selectService(selected: Service) {
    go({
      layanan: selected.id,
      langkah: 2,
      tanggal: undefined,
      jam: undefined,
      artist: undefined,
    })
  }

  async function submit() {
    if (!service || !search.jam || !guest) return
    setNotice(null)
    try {
      const confirmation = await mutation.mutateAsync({
        service_id: service.id,
        start_at: search.jam,
        artist_id: search.artist,
        customer_name: guest.customer_name,
        customer_phone: normalizePhone(guest.customer_phone) ?? guest.customer_phone,
        customer_note: guest.customer_note || undefined,
        reference_image_url: guest.reference_image_url || undefined,
      })
      onBooked(confirmation)
    } catch (error) {
      handleSubmitError(error)
    }
  }

  function handleSubmitError(error: unknown) {
    const apiError = toApiError(error)
    if (apiError.code === 'SLOT_UNAVAILABLE') {
      // Keep the guest details; only the time has to change.
      onSearchChange({ ...search, langkah: 2, jam: undefined })
      setNotice(ERROR_COPY.slotUnavailable)
    } else if (apiError.status === 429) {
      startCountdown(apiError.retryAfter ?? 60)
    } else if (apiError.status === 422) {
      applyApiErrors(form.setError, apiError, GUEST_FIELDS)
      onSearchChange({ ...search, langkah: 3 })
    } else if (apiError.status === 404) {
      onSearchChange({
        langkah: 1,
        layanan: undefined,
        tanggal: undefined,
        jam: undefined,
        artist: undefined,
      })
      setNotice('Layanan atau artist yang Anda pilih sudah tidak tersedia. Silakan pilih ulang.')
    } else {
      setNotice(errorMessage(apiError))
    }
  }

  const isRateLimited = secondsLeft > 0
  const serverError = form.formState.errors.root?.server?.message

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 py-8 md:py-12">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <WizardProgress step={step} total={TOTAL_STEPS} title={TITLES[step - 1] ?? ''} />
        </div>
        <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
          <X aria-hidden />
          Batal
        </Button>
      </div>

      {notice ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      {isRateLimited ? (
        <Alert variant="destructive" aria-live="polite">
          <TriangleAlert aria-hidden />
          <AlertDescription>{rateLimitedMessage(secondsLeft)}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <StepService state={services} selectedId={search.layanan} onSelect={selectService} />
      ) : null}

      {step === 2 && service ? (
        <StepDatetime
          service={service}
          date={search.tanggal}
          slot={search.jam}
          artistId={search.artist}
          onChangeService={() => go({ langkah: 1 })}
          onDate={(tanggal) => go({ tanggal, jam: undefined })}
          onSlot={(jam) => go({ jam })}
          onArtist={(artist) => go({ artist, jam: undefined })}
        />
      ) : null}

      {step === 3 ? (
        <form
          noValidate
          onSubmit={form.handleSubmit((values) => {
            setGuest(values)
            go({ langkah: 4 })
          })}
          className="space-y-6"
        >
          <StepGuest form={form} />
          {serverError ? (
            <p role="alert" className="text-sm font-medium">
              {serverError}
            </p>
          ) : null}
          <StepActions onBack={() => go({ langkah: 2 })} nextLabel="Lanjut" nextType="submit" />
        </form>
      ) : null}

      {step === 4 && service && search.jam && guest ? (
        <div className="space-y-6">
          <StepReview
            service={service}
            startAt={search.jam}
            artistName={artistName}
            guest={guest}
          />
          <StepActions
            onBack={() => go({ langkah: 3 })}
            nextLabel={mutation.isPending ? 'Mengirim...' : 'Kirim pemesanan'}
            nextType="button"
            onNext={() => void submit()}
            isBusy={mutation.isPending}
            disabled={mutation.isPending || isRateLimited}
          />
        </div>
      ) : null}

      {step === 2 && service ? (
        <StepActions
          onBack={() => go({ langkah: 1 })}
          nextLabel="Lanjut"
          nextType="button"
          onNext={() => go({ langkah: 3 })}
          disabled={!hasSlot}
        />
      ) : null}
    </div>
  )
}

type StepActionsProps = {
  onBack: () => void
  nextLabel: string
  nextType: 'button' | 'submit'
  onNext?: () => void
  disabled?: boolean
  isBusy?: boolean
}

function StepActions({
  onBack,
  nextLabel,
  nextType,
  onNext,
  disabled = false,
  isBusy = false,
}: StepActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
      <Button type="button" variant="outline" size="lg" onClick={onBack}>
        Kembali
      </Button>
      <Button type={nextType} size="lg" onClick={onNext} disabled={disabled}>
        {isBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {nextLabel}
      </Button>
    </div>
  )
}
