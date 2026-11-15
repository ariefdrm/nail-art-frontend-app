import { TriangleAlert } from 'lucide-react'

import { ErrorState } from '@/components/common/error-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useSummaryQuery } from '@/features/dashboard/queries'
import { presetRange, rangeProblem } from '@/features/dashboard/ranges'
import { formatDayRange, todayWib } from '@/lib/format'
import { cn } from '@/lib/utils'

import { RangePicker } from './range-picker'
import { StatusBreakdown } from './status-breakdown'
import { MetricRows, RevenueFigure } from './summary-ledger'

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
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div>
          <h1 className="text-sm font-medium">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Halo, {adminName}</p>
          <p className="mt-4 font-display text-4xl leading-tight font-medium tracking-tight md:text-5xl">
            {formatDayRange(range.dari, range.sampai)}
          </p>
        </div>
        <RangePicker range={range} onChange={(next) => onSearchChange(next)} />
      </header>

      {problem ? (
        <Alert variant="destructive" role="alert">
          <TriangleAlert aria-hidden />
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      ) : null}

      {problem === null && query.isPending ? (
        <div
          className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16"
          aria-busy="true"
          aria-label="Memuat ringkasan"
        >
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full max-w-md" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}
      {problem === null && query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}

      {problem === null && query.isSuccess ? (
        <div
          className={cn('space-y-14', query.isPlaceholderData && 'opacity-60')}
          aria-busy={query.isPlaceholderData}
          aria-live="polite"
        >
          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <RevenueFigure summary={query.data} />
            <MetricRows summary={query.data} />
          </div>
          <StatusBreakdown byStatus={query.data.by_status} />
        </div>
      ) : null}
    </div>
  )
}
