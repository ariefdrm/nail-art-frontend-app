import { Controller, useWatch } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { DAY_NAMES } from '@/features/schedule/schemas'

import type { HoursFormValues } from '@/features/schedule/schemas'
import type { UseFormReturn } from 'react-hook-form'

type TimeField = 'open_time' | 'close_time' | 'break_start' | 'break_end'

type HoursDayRowProps = { form: UseFormReturn<HoursFormValues>; day: number }

const TIME_INPUT = 'h-9'

export function HoursDayRow({ form, day }: HoursDayRowProps) {
  const name = DAY_NAMES[day] ?? ''
  const isOpen = useWatch({ control: form.control, name: `days.${day}.is_open` })
  const errors = form.formState.errors.days?.[day]
  const messages = [errors?.open_time, errors?.close_time, errors?.break_start, errors?.break_end]
    .map((error) => error?.message)
    .filter((message): message is string => Boolean(message))

  function time(field: TimeField, label: string) {
    return (
      <Input
        type="time"
        aria-label={`${name}: ${label}`}
        aria-invalid={errors?.[field] ? true : undefined}
        className={TIME_INPUT}
        {...form.register(`days.${day}.${field}`)}
      />
    )
  }

  return (
    <li className="space-y-2 border-b border-border p-4 last:border-b-0">
      <div className="grid gap-3 md:grid-cols-[7rem_9rem_1fr_1fr] md:items-center">
        <p className="font-medium">{name}</p>
        <div className="flex items-center gap-3">
          <Controller
            control={form.control}
            name={`days.${day}.is_open`}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label={`${name}: buka`}
              />
            )}
          />
          <span className="text-sm">{isOpen ? 'Buka' : 'Tutup'}</span>
        </div>

        {isOpen ? (
          <>
            <fieldset className="flex items-center gap-2">
              <legend className="sr-only">{name}: jam operasional</legend>
              {time('open_time', 'jam buka')}
              <span aria-hidden>-</span>
              {time('close_time', 'jam tutup')}
            </fieldset>
            <fieldset className="flex items-center gap-2">
              <legend className="sr-only">{name}: istirahat</legend>
              <span className="text-xs text-muted-foreground" aria-hidden>
                Istirahat
              </span>
              {time('break_start', 'mulai istirahat')}
              <span aria-hidden>-</span>
              {time('break_end', 'selesai istirahat')}
            </fieldset>
          </>
        ) : (
          <p className="text-sm text-muted-foreground md:col-span-2">Studio tutup pada hari ini.</p>
        )}
      </div>
      {messages.length > 0 ? (
        <p role="alert" className="text-sm font-medium md:pl-[7rem]">
          {messages.join('. ')}
        </p>
      ) : null}
    </li>
  )
}
