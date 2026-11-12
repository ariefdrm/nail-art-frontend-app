import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { lookupSchema } from '@/features/booking-lookup/schemas'

import type { LookupValues } from '@/features/booking-lookup/schemas'

type LookupFormProps = {
  onSubmit: (values: LookupValues) => Promise<void>
  isBlocked: boolean
}

export function LookupForm({ onSubmit, isBlocked }: LookupFormProps) {
  const form = useForm<LookupValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { booking_code: '', phone: '' },
  })
  const { errors, isSubmitting } = form.formState

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField id="booking_code" label="Kode booking" error={errors.booking_code?.message}>
        {(control) => (
          <Input
            {...control}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="NP-20261110-A7K2"
            className="font-mono tracking-wider"
            {...form.register('booking_code')}
          />
        )}
      </FormField>
      <FormField
        id="phone"
        label="Nomor HP"
        hint="Nomor yang Anda pakai saat memesan."
        error={errors.phone?.message}
      >
        {(control) => (
          <Input
            {...control}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...form.register('phone')}
          />
        )}
      </FormField>
      <Button type="submit" size="xl" className="w-full" disabled={isSubmitting || isBlocked}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />}
        {isSubmitting ? 'Mencari...' : 'Cari pesanan'}
      </Button>
    </form>
  )
}
