import { zodResolver } from '@hookform/resolvers/zod'
import { useBlocker } from '@tanstack/react-router'
import { Copy, Loader2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSaveBusinessHoursMutation } from '@/features/schedule/queries'
import {
  DISPLAY_ORDER,
  hoursFormSchema,
  parseHoursField,
  toBusinessHours,
  toHoursFormValues,
} from '@/features/schedule/schemas'
import { errorMessage, toApiError } from '@/lib/api/errors'

import { HoursDayRow } from './hours-day-row'

import type { HoursFormValues } from '@/features/schedule/schemas'
import type { BusinessHour } from '@/lib/api/types'

const COPIED_FIELDS = ['is_open', 'open_time', 'close_time', 'break_start', 'break_end'] as const
const MONDAY = 1
const TUESDAY_TO_SATURDAY = [2, 3, 4, 5, 6] as const

type HoursEditorProps = { rows: BusinessHour[] }

export function HoursEditor({ rows }: HoursEditorProps) {
  const [notice, setNotice] = useState<string | null>(null)
  const form = useForm<HoursFormValues>({
    resolver: zodResolver(hoursFormSchema),
    defaultValues: toHoursFormValues(rows),
  })
  const save = useSaveBusinessHoursMutation()
  const { isDirty } = form.formState

  // Leaving with edits would silently throw them away: ask first (also on closing the tab).
  const blocker = useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: () => isDirty,
    withResolver: true,
  })

  function copyMonday() {
    for (const day of TUESDAY_TO_SATURDAY) {
      for (const field of COPIED_FIELDS) {
        form.setValue(`days.${day}.${field}`, form.getValues(`days.${MONDAY}.${field}`), {
          shouldDirty: true,
          shouldValidate: form.formState.isSubmitted,
        })
      }
    }
  }

  async function submit(values: HoursFormValues) {
    setNotice(null)
    try {
      const saved = await save.mutateAsync(toBusinessHours(values))
      form.reset(toHoursFormValues(saved))
      toast.success('Jam operasional disimpan')
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status !== 422) {
        setNotice(errorMessage(apiError))
        return
      }
      let unmatched = false
      for (const detail of apiError.details) {
        const target = parseHoursField(detail.field)
        if (target) {
          form.setError(
            `days.${target.day}.${target.field === 'is_open' ? 'open_time' : target.field}`,
            {
              type: 'server',
              message: detail.message,
            },
          )
        } else {
          unmatched = true
        }
      }
      if (unmatched || apiError.details.length === 0) setNotice(errorMessage(apiError))
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-6">
      <p className="max-w-prose text-sm text-muted-foreground">
        Perubahan hanya berlaku untuk jadwal ke depan. Reservasi yang sudah ada tidak berubah.
      </p>

      {notice ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <ul className="overflow-hidden rounded-lg border border-border">
        {DISPLAY_ORDER.map((day) => (
          <HoursDayRow key={day} form={form} day={day} />
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={!isDirty || save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {save.isPending ? 'Menyimpan...' : 'Simpan perubahan'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={copyMonday}>
          <Copy aria-hidden />
          Salin Senin ke Selasa sampai Sabtu
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={!isDirty}
          onClick={() => form.reset(toHoursFormValues(rows))}
        >
          Batalkan perubahan
        </Button>
      </div>

      <ConfirmDialog
        isOpen={blocker.status === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.status === 'blocked') blocker.reset()
        }}
        title="Perubahan belum disimpan"
        confirmLabel="Buang perubahan"
        isPending={false}
        onConfirm={() => {
          if (blocker.status === 'blocked') blocker.proceed()
        }}
      >
        <p>Jika Anda pindah sekarang, perubahan jam operasional akan hilang.</p>
      </ConfirmDialog>
    </form>
  )
}
