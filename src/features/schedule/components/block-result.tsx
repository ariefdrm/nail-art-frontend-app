import { Link } from '@tanstack/react-router'
import { CircleCheck, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'

import { AffectedList } from './affected-list'

import type { BlockedSlotCreated } from '@/lib/api/types'

type BlockResultProps = { block: BlockedSlotCreated; onDone: () => void }

export function BlockResult({ block, onDone }: BlockResultProps) {
  const affected = block.affected_bookings
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
        <p className="flex items-center gap-2 font-medium">
          <CircleCheck className="size-5" aria-hidden />
          Waktu berhasil diblokir.
        </p>
        {affected.length > 0 ? (
          <>
            <Alert variant="destructive">
              <TriangleAlert aria-hidden />
              <AlertDescription>
                {affected.length} reservasi terdampak. Hubungi pelanggan lalu jadwalkan ulang atau
                batalkan reservasinya di halaman Reservasi. Tidak ada yang dibatalkan otomatis.
              </AlertDescription>
            </Alert>
            <AffectedList bookings={affected} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada reservasi yang terdampak.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-border p-6">
        {affected.length > 0 ? (
          <Link
            to="/admin/reservasi"
            search={{ status: 'confirmed' }}
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            Buka halaman Reservasi
          </Link>
        ) : null}
        <Button type="button" size="lg" onClick={onDone}>
          Selesai
        </Button>
      </div>
    </div>
  )
}
