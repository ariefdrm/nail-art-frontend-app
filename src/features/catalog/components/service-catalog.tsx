import { Sparkles } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { useServicesQuery } from '@/features/catalog/queries'
import { formatCategory } from '@/lib/format'

import { CategoryFilter } from './category-filter'
import { ServiceCard } from './service-card'
import { ServiceDetailSheet } from './service-detail-sheet'
import { ServiceGrid, ServiceGridSkeleton } from './service-grid'

export type CatalogSearch = { kategori?: string | undefined; layanan?: string | undefined }

type ServiceCatalogProps = {
  search: CatalogSearch
  onSearchChange: (next: CatalogSearch) => void
}

export function ServiceCatalog({ search, onSearchChange }: ServiceCatalogProps) {
  const query = useServicesQuery()

  const services = query.data ?? []
  const categories = [...new Set(services.map((service) => service.category))].sort()
  const visible = search.kategori
    ? services.filter((service) => service.category === search.kategori)
    : services

  return (
    <div className="space-y-8">
      {categories.length > 1 ? (
        <CategoryFilter
          categories={categories}
          selected={search.kategori}
          onSelect={(kategori) => onSearchChange({ ...search, kategori })}
        />
      ) : null}

      {query.isPending ? <ServiceGridSkeleton count={6} /> : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}

      {query.isSuccess && services.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" aria-hidden />}
          title="Belum ada layanan"
          description="Daftar layanan akan tampil di sini begitu studio selesai menyusunnya."
        />
      ) : null}

      {query.isSuccess && services.length > 0 && visible.length === 0 ? (
        <EmptyState
          title={`Belum ada layanan ${formatCategory(search.kategori ?? '').toLowerCase()}`}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => onSearchChange({ ...search, kategori: undefined })}
            >
              Hapus filter
            </Button>
          }
        />
      ) : null}

      {visible.length > 0 ? (
        <div role="region" aria-live="polite" aria-label="Daftar layanan">
          <ServiceGrid>
            {visible.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service}>
                  {(content, className) => (
                    <button
                      type="button"
                      className={className}
                      onClick={() => onSearchChange({ ...search, layanan: service.id })}
                    >
                      {content}
                    </button>
                  )}
                </ServiceCard>
              </li>
            ))}
          </ServiceGrid>
        </div>
      ) : null}

      <ServiceDetailSheet
        serviceId={search.layanan}
        onClose={() => onSearchChange({ ...search, layanan: undefined })}
      />
    </div>
  )
}
