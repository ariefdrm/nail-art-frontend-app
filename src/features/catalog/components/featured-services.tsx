import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { useServicesQuery } from '@/lib/api/public-queries'

import { ServiceCard } from './service-card'
import { ServiceGrid, ServiceGridSkeleton } from './service-grid'

const FEATURED_COUNT = 6

/** Home page section: the first services from the catalog (FE-01). */
export function FeaturedServices() {
  const query = useServicesQuery()

  return (
    <section className="py-16 md:py-24" aria-labelledby="featured-title">
      <div className="mb-8 flex items-baseline justify-between gap-4">
        <h2 id="featured-title" className="text-2xl font-semibold tracking-tight">
          Layanan pilihan
        </h2>
        <Link to="/layanan" className="text-sm font-medium underline-offset-4 hover:underline">
          Lihat semua layanan
        </Link>
      </div>

      {query.isPending ? <ServiceGridSkeleton /> : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}
      {query.isSuccess && query.data.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" aria-hidden />}
          title="Layanan sedang disiapkan"
          description="Daftar layanan akan tampil di sini begitu studio selesai menyusunnya."
        />
      ) : null}
      {query.isSuccess && query.data.length > 0 ? (
        <ServiceGrid>
          {query.data.slice(0, FEATURED_COUNT).map((service) => (
            <li key={service.id}>
              <ServiceCard service={service}>
                {(content, className) => (
                  <Link to="/layanan" search={{ layanan: service.id }} className={className}>
                    {content}
                  </Link>
                )}
              </ServiceCard>
            </li>
          ))}
        </ServiceGrid>
      ) : null}
    </section>
  )
}
