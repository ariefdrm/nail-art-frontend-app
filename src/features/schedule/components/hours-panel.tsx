import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusinessHoursQuery } from '@/features/schedule/queries'

import { HoursEditor } from './hours-editor'

export function HoursPanel() {
  const query = useBusinessHoursQuery()

  if (query.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Memuat jam operasional">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    )
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  // Keyed by the stored data so a reload (or a save elsewhere) starts the form from the new values.
  return <HoursEditor key={JSON.stringify(query.data)} rows={query.data} />
}
