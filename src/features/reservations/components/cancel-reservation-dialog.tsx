import { Loader2, XCircle } from 'lucide-react'
import { useState } from 'react'

import { FormField } from '@/components/common/form-field'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const MAX_REASON = 255

type CancelReservationDialogProps = {
  bookingCode: string
  isPending: boolean
  onConfirm: (reason: string) => void
}

export function CancelReservationDialog({
  bookingCode,
  isPending,
  onConfirm,
}: CancelReservationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const trimmed = reason.trim()
  const error = reason.length > MAX_REASON ? `Alasan maksimal ${MAX_REASON} huruf` : undefined

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
        <XCircle aria-hidden />
        Batalkan
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan reservasi {bookingCode}?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Slot akan kembali tersedia.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FormField id="cancel-reason" label="Alasan pembatalan" error={error}>
          {(control) => (
            <Textarea
              {...control}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          )}
        </FormField>
        <AlertDialogFooter>
          <AlertDialogCancel>Kembali</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={trimmed === '' || error !== undefined || isPending}
            onClick={() => {
              onConfirm(trimmed)
              setIsOpen(false)
              setReason('')
            }}
          >
            {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <XCircle aria-hidden />}
            Batalkan reservasi
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
