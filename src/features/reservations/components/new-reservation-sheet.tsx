import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { ManualReservationForm } from './manual-reservation-form'

import type { Booking } from '@/lib/api/types'

type NewReservationSheetProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: (booking: Booking) => void
}

export function NewReservationSheet({ isOpen, onClose, onCreated }: NewReservationSheetProps) {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-xl">Reservasi baru</SheetTitle>
          <SheetDescription>
            Untuk pelanggan yang datang langsung atau memesan lewat chat. Reservasi langsung
            berstatus terkonfirmasi.
          </SheetDescription>
        </SheetHeader>
        <ManualReservationForm onCreated={onCreated} />
      </SheetContent>
    </Sheet>
  )
}
