import { useState } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { BlockResult } from './block-result'
import { NewBlockForm } from './new-block-form'

import type { BlockedSlotCreated } from '@/lib/api/types'

type NewBlockSheetProps = { isOpen: boolean; onClose: () => void }

export function NewBlockSheet({ isOpen, onClose }: NewBlockSheetProps) {
  // Set once the block exists, so the panel can show who was affected before it closes.
  const [created, setCreated] = useState<BlockedSlotCreated | null>(null)

  function close() {
    setCreated(null)
    onClose()
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-xl">{created ? 'Blokir dibuat' : 'Blokir waktu'}</SheetTitle>
          <SheetDescription>
            {created
              ? 'Ringkasan reservasi yang berada di waktu ini.'
              : 'Tutup seluruh studio atau satu artist untuk libur, cuti, atau keperluan lain.'}
          </SheetDescription>
        </SheetHeader>
        {created ? (
          <BlockResult block={created} onDone={close} />
        ) : (
          <NewBlockForm onCreated={setCreated} />
        )}
      </SheetContent>
    </Sheet>
  )
}
