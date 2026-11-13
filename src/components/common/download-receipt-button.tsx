import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { downloadReceipt } from '@/lib/booking-receipt'

import type { ReceiptData } from '@/lib/booking-receipt'

type DownloadReceiptButtonProps = { receipt: ReceiptData; className?: string }

/** Saves the booking receipt as an image, so the code survives a forgotten tab or a lost chat. */
export function DownloadReceiptButton({ receipt, className }: DownloadReceiptButtonProps) {
  const [isBusy, setIsBusy] = useState(false)

  async function download() {
    setIsBusy(true)
    try {
      await downloadReceipt(receipt)
      toast.success('Bukti booking diunduh')
    } catch {
      toast.error('Bukti tidak dapat dibuat. Salin kode booking secara manual.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={className}
      disabled={isBusy}
      onClick={() => void download()}
    >
      {isBusy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
      Unduh bukti
    </Button>
  )
}
