import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import type { UpdateReservationInput } from '@/features/reservations/api'
import type { Booking } from '@/lib/api/types'

const MAX_CUSTOMER_NOTE = 500
const MAX_ADMIN_NOTE = 1000

type NotesFormProps = {
  booking: Booking
  isPending: boolean
  onSave: (input: UpdateReservationInput) => void
}

/** Remount it (key) after a save so it starts from the stored values. */
export function NotesForm({ booking, isPending, onSave }: NotesFormProps) {
  const [customerNote, setCustomerNote] = useState(booking.customer_note ?? '')
  const [adminNote, setAdminNote] = useState(booking.admin_note ?? '')

  const customerChanged = customerNote !== (booking.customer_note ?? '')
  const adminChanged = adminNote !== (booking.admin_note ?? '')
  const customerError =
    customerNote.length > MAX_CUSTOMER_NOTE ? `Maksimal ${MAX_CUSTOMER_NOTE} huruf` : undefined
  const adminError =
    adminNote.length > MAX_ADMIN_NOTE ? `Maksimal ${MAX_ADMIN_NOTE} huruf` : undefined
  const canSave = (customerChanged || adminChanged) && !customerError && !adminError && !isPending

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        // Only send what changed; an empty string clears the note on the server.
        onSave({
          ...(customerChanged ? { customer_note: customerNote } : {}),
          ...(adminChanged ? { admin_note: adminNote } : {}),
        })
      }}
    >
      <FormField id="customer-note" label="Catatan pelanggan" error={customerError}>
        {(control) => (
          <Textarea
            {...control}
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
          />
        )}
      </FormField>
      <FormField
        id="admin-note"
        label="Catatan admin"
        hint="Hanya terlihat oleh pemilik dan staf."
        error={adminError}
      >
        {(control) => (
          <Textarea
            {...control}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
          />
        )}
      </FormField>
      <Button type="submit" variant="outline" disabled={!canSave}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Simpan catatan
      </Button>
    </form>
  )
}
