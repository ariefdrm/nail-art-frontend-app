import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BookingWizard } from '@/features/booking/components/booking-wizard'
import { CustomerLayout } from '@/layouts/customer-layout'
import { useServicesQuery } from '@/lib/api/public-queries'

const DAY = /^\d{4}-\d{2}-\d{2}$/

const searchSchema = z.object({
  langkah: z.number().int().min(1).max(4).optional().catch(undefined),
  layanan: z.string().uuid().optional().catch(undefined),
  tanggal: z.string().regex(DAY).optional().catch(undefined),
  jam: z.string().min(1).optional().catch(undefined),
  artist: z.string().uuid().optional().catch(undefined),
})

export const Route = createFileRoute('/pesan/')({
  validateSearch: searchSchema,
  component: BookingPage,
  ssr: false,
})

function BookingPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const services = useServicesQuery()

  return (
    <CustomerLayout>
      <BookingWizard
        search={search}
        // Steps are pushed to history so the browser's back button walks the wizard.
        onSearchChange={(next) => void navigate({ search: next })}
        services={{
          services: services.data,
          isPending: services.isPending,
          error: services.error,
          onRetry: () => void services.refetch(),
        }}
        onBooked={(booking) => void navigate({ to: '/pesan/berhasil', state: { booking } })}
        onCancel={() => void navigate({ to: '/' })}
      />
    </CustomerLayout>
  )
}
