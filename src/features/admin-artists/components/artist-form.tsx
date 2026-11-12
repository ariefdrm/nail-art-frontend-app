import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { FormField } from '@/components/common/form-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCreateArtistMutation, useUpdateArtistMutation } from '@/features/admin-artists/queries'
import {
  ARTIST_FIELDS,
  EMPTY_ARTIST,
  artistFormSchema,
  toArtistInput,
  toFormValues,
} from '@/features/admin-artists/schemas'
import { applyApiErrors, errorMessage } from '@/lib/api/errors'

import { UpcomingWarning } from './upcoming-warning'

import type { ArtistFormValues } from '@/features/admin-artists/schemas'
import type { Artist } from '@/lib/api/types'

type ArtistFormProps = { artist: Artist | undefined; onSaved: () => void }

export function ArtistForm({ artist, onSaved }: ArtistFormProps) {
  const [notice, setNotice] = useState<string | null>(null)
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: artist ? toFormValues(artist) : EMPTY_ARTIST,
    mode: 'onTouched',
  })
  const create = useCreateArtistMutation()
  const update = useUpdateArtistMutation(artist?.id ?? '')
  const isPending = create.isPending || update.isPending
  const { errors } = form.formState
  const isActive = useWatch({ control: form.control, name: 'is_active' })

  async function submit(values: ArtistFormValues) {
    setNotice(null)
    try {
      if (artist) await update.mutateAsync(toArtistInput(values, 'edit'))
      else await create.mutateAsync(toArtistInput(values, 'create'))
      toast.success(artist ? 'Artist diperbarui' : 'Artist ditambahkan')
      onSaved()
    } catch (error) {
      const handled = applyApiErrors(form.setError, error, ARTIST_FIELDS)
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

        <FormField id="name" label="Nama artist" error={errors.name?.message}>
          {(control) => <Input {...control} autoComplete="off" {...form.register('name')} />}
        </FormField>

        <FormField
          id="photo_url"
          label="Tautan foto (opsional)"
          hint="Alamat gambar yang diawali https://."
          error={errors.photo_url?.message}
        >
          {(control) => (
            <Input {...control} type="url" inputMode="url" {...form.register('photo_url')} />
          )}
        </FormField>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <div>
            <Label htmlFor="is_active" className="text-sm font-medium">
              Aktif
            </Label>
            <p className="text-xs text-muted-foreground">
              Artist nonaktif tidak bisa dipilih untuk reservasi baru.
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

        <UpcomingWarning
          artistId={artist?.id}
          isRelevant={artist !== undefined && artist.is_active && !isActive}
        />

        {serverError ? (
          <p role="alert" className="text-sm font-medium">
            {serverError}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border p-6">
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {isPending ? 'Menyimpan...' : artist ? 'Simpan perubahan' : 'Tambah artist'}
        </Button>
      </div>
    </form>
  )
}
