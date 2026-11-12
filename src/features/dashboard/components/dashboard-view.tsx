import { TriangleAlert } from 'lucide-react'

import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useSummaryQuery } from '@/features/dashboard/queries'
import { presetRange, rangeProblem } from '@/features/dashboard/ranges'
import { formatDayRange, formatMinutes, formatPercent, formatRupiah, todayWib } from '@/lib/format'
import { cn } from '@/lib/utils'

import { RangePicker } from './range-picker'
import { StatCard } from './stat-card'
import { StatusBreakdown } from './status-breakdown'

import type { SummaryRange } from '@/features/dashboard/api'

export type DashboardSearch = { dari?: string | undefined; sampai?: string | undefined }

type DashboardViewProps = {
  adminName: string
  search: DashboardSearch
  onSearchChange: (next: DashboardSearch) => void
}

export function DashboardView({ adminName, search, onSearchChange }: DashboardViewProps) {
  // Without dates in the URL the dashboard opens on the last seven days.
  const range: SummaryRange =
    search.dari && search.sampai
      ? { dari: search.dari, sampai: search.sampai }
      : presetRange('7-hari', todayWib())
  const problem = rangeProblem(range)
  const query = useSummaryQuery(range, problem === null)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Halo, ${adminName}. Ringkasan ${formatDayRange(range.dari, range.sampai)}.`}
      />

      <RangePicker range={range} onChange={(next) => onSearchChange(next)} />

      {problem ? (
        <Alert variant="destructive" role="alert">
          <TriangleAlert aria-hidden />
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      ) : null}

      {problem === null && query.isPending ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Memuat ringkasan"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      ) : null}
      {problem === null && query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}

      {problem === null && query.isSuccess ? (
        <div
          className={cn('space-y-10', query.isPlaceholderData && 'opacity-60')}
          aria-busy={query.isPlaceholderData}
          aria-live="polite"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total reservasi"
              value={String(query.data.total_bookings)}
              note="semua status"
            />
            <StatCard
              label="Pendapatan"
              value={formatRupiah(query.data.revenue_completed)}
              note="dari reservasi selesai"
            />
            <StatCard
              label="Rasio online"
              value={
                query.data.online_booking_ratio === null
                  ? null
                  : formatPercent(query.data.online_booking_ratio)
              }
              note="dari semua reservasi"
            />
            <StatCard
              label="Tidak hadir"
              value={
                query.data.no_show_rate === null ? null : formatPercent(query.data.no_show_rate)
              }
              note="dari yang selesai atau tidak hadir"
            />
            <StatCard
              label="Rata-rata konfirmasi"
              value={
                query.data.avg_confirmation_minutes === null
                  ? null
                  : formatMinutes(query.data.avg_confirmation_minutes)
              }
              note="reservasi online sampai dikonfirmasi"
            />
          </div>
          <StatusBreakdown byStatus={query.data.by_status} />
        </div>
      ) : null}
    </div>
  )
}
