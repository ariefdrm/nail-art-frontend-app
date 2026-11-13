import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FormField } from '@/components/common/form-field'
import { NativeSelect } from '@/components/common/native-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCheckBlockMutation, useCreateBlockMutation } from '@/features/schedule/queries'
import { BLOCK_FIELDS, blockFormSchema, toBlockInput } from '@/features/schedule/schemas'
import { applyApiErrors, errorMessage, toApiError } from '@/lib/api/errors'
import { useArtistsQuery } from '@/lib/api/public-queries'
import { todayWib } from '@/lib/format'

import { AffectedList } from './affected-list'

import type { BlockInput } from '@/features/schedule/api'
import type { BlockFormValues } from '@/features/schedule/schemas'
import type { AffectedBooking, BlockedSlotCreated } from '@/lib/api/types'

type NewBlockFormProps = { onCreated: (block: BlockedSlotCreated) => void }

export function NewBlockForm({ onCreated }: NewBlockFormProps) {
  const today = todayWib()
  const [notice, setNotice] = useState<string | null>(null)
  /** What the owner asked for, kept while the conflict dialog waits for their decision. */
  const [pending, setPending] = useState<{
    input: BlockInput
    conflicts: AffectedBooking[]
  } | null>(null)
  const form = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      scope: '',
      start_date: today,
      start_time: '09:00',
      end_date: today,
      end_time: '17:00',
      reason: '',
    },
    mode: 'onTouched',
  })
  const artists = useArtistsQuery()
  const check = useCheckBlockMutation()
  const create = useCreateBlockMutation()
  const { errors } = form.formState

  async function place(input: BlockInput) {
    const block = await create.mutateAsync(input)
    onCreated(block)
  }

  async function submit(values: BlockFormValues) {
    setNotice(null)
    const input = toBlockInput(values)
    try {
      // Always look before blocking: nothing is cancelled automatically (PRD FE-12).
      const preview = await check.mutateAsync(input)
      if (!preview.can_block) {
        setPending({ input, conflicts: preview.conflicts })
        return
      }
      await place(input)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'BLOCK_HAS_BOOKINGS') {
        // A booking arrived between the check and the create: same dialog, fresh list.
        setPending({ input, conflicts: apiError.conflicts })
      } else if (apiError.status === 422) {
        applyApiErrors(form.setError, apiError, BLOCK_FIELDS)
      } else {
        setNotice(errorMessage(apiError))
      }
    }
  }

  async function confirmAnyway() {
    if (!pending) return
    try {
      await place({ ...pending.input, acknowledge_conflicts: true })
      setPending(null)
    } catch (error) {
      setPending(null)
      setNotice(errorMessage(error))
    }
  }

  const isBusy = check.isPending || create.isPending
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

        <FormField
          id="scope"
          label="Yang diblokir"
          hint={
            artists.isError
              ? 'Daftar artist tidak dapat dimuat, jadi saat ini hanya seluruh studio yang bisa diblokir.'
              : undefined
          }
        >
          {(control) => (
            <NativeSelect {...control} {...form.register('scope')}>
              <option value="">Seluruh studio</option>
              {artists.data?.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  Hanya {artist.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Mulai</legend>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="start_date" label="Tanggal" error={errors.start_date?.message}>
              {(control) => <Input {...control} type="date" {...form.register('start_date')} />}
            </FormField>
            <FormField id="start_time" label="Jam" error={errors.start_time?.message}>
              {(control) => <Input {...control} type="time" {...form.register('start_time')} />}
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Selesai</legend>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="end_date" label="Tanggal" error={errors.end_date?.message}>
              {(control) => <Input {...control} type="date" {...form.register('end_date')} />}
            </FormField>
            <FormField id="end_time" label="Jam" error={errors.end_time?.message}>
              {(control) => <Input {...control} type="time" {...form.register('end_time')} />}
            </FormField>
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => {
              form.setValue('start_time', '00:00', { shouldDirty: true })
              form.setValue('end_time', '23:59', { shouldDirty: true })
            }}
          >
            Isi sepanjang hari (00.00 sampai 23.59)
          </Button>
        </fieldset>

        <FormField
          id="reason"
          label="Alasan (opsional)"
          hint="Hanya untuk catatan Anda. Alasan ini tidak dikirim ke pelanggan."
          error={errors.reason?.message}
        >
          {(control) => <Textarea {...control} {...form.register('reason')} />}
        </FormField>

        {serverError ? (
          <p role="alert" className="text-sm font-medium">
            {serverError}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border p-6">
        <Button type="submit" size="lg" className="w-full" disabled={isBusy}>
          {isBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {check.isPending
            ? 'Memeriksa reservasi...'
            : create.isPending
              ? 'Memblokir...'
              : 'Blokir waktu'}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        title={`Ada ${pending?.conflicts.length ?? 0} reservasi pada waktu ini`}
        confirmLabel="Tetap blokir"
        isPending={create.isPending}
        onConfirm={() => void confirmAnyway()}
      >
        <div className="space-y-3">
          <p>
            Memblokir tidak membatalkan reservasi ini. Hubungi pelanggan, lalu jadwalkan ulang atau
            batalkan reservasinya.
          </p>
          {pending ? <AffectedList bookings={pending.conflicts} /> : null}
        </div>
      </ConfirmDialog>
    </form>
  )
}
