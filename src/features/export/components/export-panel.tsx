import { Download, Info, Loader2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/components/common/form-field'
import { NativeSelect } from '@/components/common/native-select'
import { PageHeader } from '@/components/common/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExportCsvMutation } from '@/features/export/queries'
import { errorMessage } from '@/lib/api/errors'
import { STATUS_LABEL } from '@/lib/copy'

import type { BookingStatus } from '@/lib/api/types'

const STATUSES = Object.keys(STATUS_LABEL) as BookingStatus[]

export function ExportPanel() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState<BookingStatus | ''>('')
  const [failure, setFailure] = useState<string | null>(null)
  const exportCsv = useExportCsvMutation()

  const reversed = from !== '' && to !== '' && to < from

  function download() {
    setFailure(null)
    exportCsv.mutate(
      { date_from: from || undefined, date_to: to || undefined, status: status || undefined },
      {
        onSuccess: (filename) => toast.success(`${filename} diunduh`),
        onError: (error) => setFailure(errorMessage(error)),
      },
    )
  }

  return (
    <div className="max-w-xl space-y-8">
      <PageHeader
        title="Ekspor"
        description="Unduh data reservasi dalam format CSV untuk dianalisis di spreadsheet."
      />

      <Alert>
        <Info aria-hidden />
        <AlertTitle>Yang ada di dalam berkas</AlertTitle>
        <AlertDescription>
          Satu baris per reservasi: status, sumber, layanan, artist, waktu, durasi, harga, dan lama
          konfirmasi. Berkas tidak berisi nama, nomor HP, kode booking, ataupun catatan bebas.
          Pelanggan yang sama dikenali lewat <code>customer_ref</code>, kode samar yang tidak bisa
          dibalik menjadi nomor HP.
        </AlertDescription>
      </Alert>

      <form
        noValidate
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (!reversed) download()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="export-from" label="Dari tanggal (opsional)">
            {(control) => (
              <Input
                {...control}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            id="export-to"
            label="Sampai tanggal (opsional)"
            error={reversed ? 'Tanggal akhir tidak boleh sebelum tanggal awal' : undefined}
          >
            {(control) => (
              <Input {...control} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            )}
          </FormField>
        </div>
        <FormField
          id="export-status"
          label="Status (opsional)"
          hint="Kosongkan untuk semua status. Tanpa tanggal, seluruh reservasi diekspor."
        >
          {(control) => (
            <NativeSelect
              {...control}
              value={status}
              onChange={(event) => setStatus(STATUSES.find((s) => s === event.target.value) ?? '')}
            >
              <option value="">Semua status</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABEL[value]}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>

        {failure ? (
          <Alert variant="destructive" role="alert">
            <TriangleAlert aria-hidden />
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" size="lg" disabled={exportCsv.isPending || reversed}>
          {exportCsv.isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Download aria-hidden />
          )}
          {exportCsv.isPending ? 'Menyiapkan berkas...' : 'Unduh CSV'}
        </Button>
      </form>
    </div>
  )
}
