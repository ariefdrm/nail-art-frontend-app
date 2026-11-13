import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Reveal } from '@/components/common/reveal'
import { buttonVariants } from '@/components/ui/button'
import { useServicesQuery } from '@/lib/api/public-queries'

import { ServiceCard } from './service-card'
import { ServiceGrid, ServiceGridSkeleton } from './service-grid'

const FEATURED_COUNT = 6

/** Home page section: the first services from the catalog (FE-01). */
export function FeaturedServices() {
  const query = useServicesQuery()

  return (
    <section className="py-16 md:py-24" aria-labelledby="featured-title">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="featured-title"
            className="font-display text-3xl font-medium tracking-tight md:text-5xl"
          >
            Layanan pilihan
          </h2>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Durasi dan harga tertera jelas sebelum Anda memesan.
          </p>
        </div>
        <Link to="/layanan" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
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
        <ServiceGrid className="lg:[&>li:nth-child(3n+2)]:mt-12">
          {query.data.slice(0, FEATURED_COUNT).map((service, index) => (
            <li key={service.id}>
              <Reveal index={index % 3}>
                <ServiceCard service={service}>
                  {(content, className) => (
                    <Link to="/layanan" search={{ layanan: service.id }} className={className}>
                      {content}
                    </Link>
                  )}
                </ServiceCard>
              </Reveal>
            </li>
          ))}
        </ServiceGrid>
      ) : null}
    </section>
  )
}
