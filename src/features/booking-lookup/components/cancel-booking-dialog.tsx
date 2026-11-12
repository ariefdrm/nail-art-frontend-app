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
import { MAX_CANCEL_REASON } from '@/features/booking-lookup/schemas'

type CancelBookingDialogProps = {
  bookingCode: string
  isPending: boolean
  isBlocked: boolean
  onConfirm: (reason: string) => void
}

export function CancelBookingDialog({
  bookingCode,
  isPending,
  isBlocked,
  onConfirm,
}: CancelBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const error =
    reason.length > MAX_CANCEL_REASON ? `Alasan maksimal ${MAX_CANCEL_REASON} huruf` : undefined

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" size="lg" disabled={isBlocked} />}
      >
        <XCircle aria-hidden />
        Batalkan pemesanan
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan reservasi {bookingCode}?</AlertDialogTitle>
          <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
        </AlertDialogHeader>
        <FormField id="cancel-reason" label="Alasan (opsional)" error={error}>
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
            disabled={error !== undefined || isPending}
            onClick={() => {
              onConfirm(reason.trim())
              setIsOpen(false)
              setReason('')
            }}
          >
            {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <XCircle aria-hidden />}
            Batalkan pemesanan
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
