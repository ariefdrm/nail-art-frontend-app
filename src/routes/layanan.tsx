import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PageHeader } from '@/components/common/page-header'
import { ServiceCatalog } from '@/features/catalog/components/service-catalog'
import { CustomerLayout } from '@/layouts/customer-layout'

const searchSchema = z.object({
  kategori: z.string().optional().catch(undefined),
  layanan: z.string().uuid().optional().catch(undefined),
})

export const Route = createFileRoute('/layanan')({
  validateSearch: searchSchema,
  component: ServicesPage,
  ssr: false,
})

function ServicesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <CustomerLayout>
      <div className="space-y-10 py-12 md:py-16">
        <PageHeader
          title="Layanan"
          description="Pilih layanan, lihat durasi dan harganya, lalu pesan jam yang Anda mau."
        />
        <ServiceCatalog
          search={search}
          onSearchChange={(next) => void navigate({ search: next, replace: true })}
        />
      </div>
    </CustomerLayout>
  )
}
