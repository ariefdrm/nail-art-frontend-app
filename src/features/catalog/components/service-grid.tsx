import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ServiceGridProps = { children: React.ReactNode; className?: string }

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8'

export function ServiceGrid({ children, className }: ServiceGridProps) {
  return <ul className={cn(GRID, className)}>{children}</ul>
}

export function ServiceGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={GRID} aria-busy="true" aria-label="Memuat layanan">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      ))}
    </div>
  )
}
