import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { EmptyState } from '@/components/common/empty-state'
import { CustomerLayout } from '@/layouts/customer-layout'

const searchSchema = z.object({ layanan: z.string().uuid().optional().catch(undefined) })

// TODO(FE-2): replace with the booking wizard.
export const Route = createFileRoute('/pesan')({
  validateSearch: searchSchema,
  component: BookingPlaceholder,
  ssr: false,
})

function BookingPlaceholder() {
  return (
    <CustomerLayout>
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          title="Pemesanan online segera dibuka"
          description="Halaman ini sedang dikerjakan. Sementara itu, Anda dapat melihat daftar layanan."
        />
      </div>
    </CustomerLayout>
  )
}
