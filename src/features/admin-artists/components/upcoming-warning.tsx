import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUpcomingBookingsQuery } from '@/features/admin-artists/queries'

type UpcomingWarningProps = { artistId: string | undefined; isRelevant: boolean }

/** Switching an artist off does not touch existing reservations, but the owner should know. */
export function UpcomingWarning({ artistId, isRelevant }: UpcomingWarningProps) {
  const query = useUpcomingBookingsQuery(artistId, isRelevant)
  if (!isRelevant || !query.data || query.data <= 0) return null

  return (
    <Alert variant="destructive" aria-live="polite">
      <TriangleAlert aria-hidden />
      <AlertDescription>
        Artist ini masih punya {query.data} reservasi mendatang yang belum selesai. Reservasi itu
        tetap berjalan; pindahkan atau hubungi pelanggan bila perlu.
      </AlertDescription>
    </Alert>
  )
}
