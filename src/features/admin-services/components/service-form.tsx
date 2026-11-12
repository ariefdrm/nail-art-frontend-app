import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { FormField } from '@/components/common/form-field'
import { NativeSelect } from '@/components/common/native-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
} from '@/features/admin-services/queries'
import {
  DURATIONS,
  EMPTY_SERVICE,
  SERVICE_FIELDS,
  serviceFormSchema,
  toFormValues,
  toServiceInput,
} from '@/features/admin-services/schemas'
import { applyApiErrors, errorMessage } from '@/lib/api/errors'
import { formatCategory, formatDuration } from '@/lib/format'

import type { ServiceFormValues } from '@/features/admin-services/schemas'
import type { Service } from '@/lib/api/types'

type ServiceFormProps = {
  /** Present when editing; absent when adding. */
  service: Service | undefined
  /** Categories already in use, offered as suggestions. */
  categories: string[]
  onSaved: () => void
}

export function ServiceForm({ service, categories, onSaved }: ServiceFormProps) {
  const [notice, setNotice] = useState<string | null>(null)
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: service ? toFormValues(service) : EMPTY_SERVICE,
    mode: 'onTouched',
  })
  const create = useCreateServiceMutation()
  const update = useUpdateServiceMutation(service?.id ?? '')
  const isPending = create.isPending || update.isPending
  const { errors } = form.formState

  async function submit(values: ServiceFormValues) {
    setNotice(null)
    try {
      if (service) await update.mutateAsync(toServiceInput(values, 'edit'))
      else await create.mutateAsync(toServiceInput(values, 'create'))
      toast.success(service ? 'Layanan diperbarui' : 'Layanan ditambahkan')
      onSaved()
    } catch (error) {
      const handled = applyApiErrors(form.setError, error, SERVICE_FIELDS)
      if (!handled) setNotice(errorMessage(error))
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

        <FormField id="name" label="Nama layanan" error={errors.name?.message}>
          {(control) => <Input {...control} {...form.register('name')} />}
        </FormField>

        <FormField
          id="category"
          label="Kategori"
          hint="Contoh: Gel Polish. Disimpan sebagai gel_polish dan dipakai untuk filter di situs."
          error={errors.category?.message}
        >
          {(control) => (
            <>
              <Input {...control} list="category-options" {...form.register('category')} />
              <datalist id="category-options">
                {categories.map((category) => (
                  <option key={category} value={formatCategory(category)} />
                ))}
              </datalist>
            </>
          )}
        </FormField>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField id="price" label="Harga (Rp)" error={errors.price?.message}>
            {(control) => (
              <Input
                {...control}
                inputMode="numeric"
                autoComplete="off"
                placeholder="150000"
                {...form.register('price')}
              />
            )}
          </FormField>
          <FormField id="duration_minutes" label="Durasi" error={errors.duration_minutes?.message}>
            {(control) => (
              // Controlled, so the stored duration is what the select shows on edit.
              <Controller
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <NativeSelect
                    {...control}
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                  >
                    {DURATIONS.map((minutes) => (
                      <option key={minutes} value={String(minutes)}>
                        {formatDuration(minutes)}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              />
            )}
          </FormField>
        </div>

        <FormField
          id="description"
          label="Deskripsi (opsional)"
          error={errors.description?.message}
        >
          {(control) => <Textarea {...control} {...form.register('description')} />}
        </FormField>

        <FormField
          id="image_url"
          label="Tautan foto (opsional)"
          hint="Foto ini tampil di katalog. Tempel alamat gambar yang diawali https://."
          error={errors.image_url?.message}
        >
          {(control) => (
            <Input {...control} type="url" inputMode="url" {...form.register('image_url')} />
          )}
        </FormField>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <div>
            <Label htmlFor="is_active" className="text-sm font-medium">
              Aktif
            </Label>
            <p className="text-xs text-muted-foreground">
              Layanan nonaktif tidak tampil dan tidak bisa dipesan.
            </p>
          </div>
          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <Switch
                id="is_active"
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="Aktif"
              />
            )}
          />
        </div>

        {serverError ? (
          <p role="alert" className="text-sm font-medium">
            {serverError}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border p-6">
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {isPending ? 'Menyimpan...' : service ? 'Simpan perubahan' : 'Tambah layanan'}
        </Button>
      </div>
    </form>
  )
}
