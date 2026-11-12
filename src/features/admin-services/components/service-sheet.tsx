import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { ServiceForm } from './service-form'

import type { Service } from '@/lib/api/types'

type ServiceSheetProps = {
  isOpen: boolean
  /** Present when editing an existing service. */
  service: Service | undefined
  categories: string[]
  onClose: () => void
}

export function ServiceSheet({ isOpen, service, categories, onClose }: ServiceSheetProps) {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-xl">{service ? 'Ubah layanan' : 'Tambah layanan'}</SheetTitle>
          <SheetDescription>
            {service
              ? 'Perubahan harga tidak memengaruhi reservasi yang sudah dibuat.'
              : 'Layanan baru langsung tampil di situs bila statusnya aktif.'}
          </SheetDescription>
        </SheetHeader>
        {/* Keyed so switching between services starts from a clean form. */}
        <ServiceForm
          key={service?.id ?? 'new'}
          service={service}
          categories={categories}
          onSaved={onClose}
        />
      </SheetContent>
    </Sheet>
  )
}
