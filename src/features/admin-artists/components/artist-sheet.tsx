import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { ArtistForm } from './artist-form'

import type { Artist } from '@/lib/api/types'

type ArtistSheetProps = { isOpen: boolean; artist: Artist | undefined; onClose: () => void }

export function ArtistSheet({ isOpen, artist, onClose }: ArtistSheetProps) {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-xl">{artist ? 'Ubah artist' : 'Tambah artist'}</SheetTitle>
          <SheetDescription>
            {artist
              ? 'Reservasi yang sudah ada tetap memakai artist ini.'
              : 'Artist baru bisa dipilih untuk reservasi begitu statusnya aktif.'}
          </SheetDescription>
        </SheetHeader>
        <ArtistForm key={artist?.id ?? 'new'} artist={artist} onSaved={onClose} />
      </SheetContent>
    </Sheet>
  )
}
