import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatPhone, normalizePhone } from '@/lib/format'

import type { GuestValues } from '@/lib/guest-schema'
import type { UseFormRegisterReturn } from 'react-hook-form'

type GuestField = keyof GuestValues

type GuestFieldsProps = {
  /** `(name) => form.register(name)` from the caller's own form, which may hold more fields. */
  register: (name: GuestField) => UseFormRegisterReturn
  errors: Partial<Record<GuestField, { message?: string | undefined } | undefined>>
  /** What was typed in the phone field, to echo the normalized number back. */
  phone: string
  className?: string
}

/** The customer's name, phone, note and reference link: shared by the booking wizard and the admin form. */
export function GuestFields({ register, errors, phone, className }: GuestFieldsProps) {
  const normalized = normalizePhone(phone) ? formatPhone(phone) : null

  return (
    <div className={className ?? 'space-y-6'}>
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
        hint="Misalnya warna atau model yang diinginkan."
        error={errors.customer_note?.message}
      >
        {(control) => <Textarea {...control} {...register('customer_note')} />}
      </FormField>

      <FormField
        id="reference_image_url"
        label="Tautan gambar referensi (opsional)"
        hint="Tempel tautan foto desain yang disukai."
        error={errors.reference_image_url?.message}
      >
        {(control) => (
          <Input {...control} type="url" inputMode="url" {...register('reference_image_url')} />
        )}
      </FormField>
    </div>
  )
}
