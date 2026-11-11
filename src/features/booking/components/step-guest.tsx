import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatPhone, normalizePhone } from '@/lib/format'

import type { GuestValues } from '@/features/booking/schemas'
import type { UseFormReturn } from 'react-hook-form'

type StepGuestProps = { form: UseFormReturn<GuestValues> }

export function StepGuest({ form }: StepGuestProps) {
  const { register, formState, watch } = form
  const { errors } = formState
  const typedPhone = watch('customer_phone')
  const normalized = normalizePhone(typedPhone) ? formatPhone(typedPhone) : null

  return (
    <div className="space-y-6">
      <FormField id="customer_name" label="Nama" error={errors.customer_name?.message}>
        {(control) => <Input {...control} autoComplete="name" {...register('customer_name')} />}
      </FormField>

      <FormField
        id="customer_phone"
        label="Nomor HP"
        hint={normalized ? `Tersimpan sebagai ${normalized}` : 'Contoh: 0812 3456 7890'}
        error={errors.customer_phone?.message}
      >
        {(control) => (
          <Input
            {...control}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register('customer_phone')}
          />
        )}
      </FormField>

      <FormField
        id="customer_note"
        label="Catatan (opsional)"
        hint="Misalnya warna atau model yang Anda inginkan."
        error={errors.customer_note?.message}
      >
        {(control) => <Textarea {...control} {...register('customer_note')} />}
      </FormField>

      <FormField
        id="reference_image_url"
        label="Tautan gambar referensi (opsional)"
        hint="Tempel tautan foto desain yang Anda suka."
        error={errors.reference_image_url?.message}
      >
        {(control) => (
          <Input {...control} type="url" inputMode="url" {...register('reference_image_url')} />
        )}
      </FormField>
    </div>
  )
}
