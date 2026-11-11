import { createFileRoute } from '@tanstack/react-router'

import { EmptyState } from '@/components/common/empty-state'
import { CustomerLayout } from '@/layouts/customer-layout'

// TODO(FE-3): replace with the booking lookup form.
export const Route = createFileRoute('/cek-booking')({
  component: LookupPlaceholder,
  ssr: false,
})

function LookupPlaceholder() {
  return (
    <CustomerLayout>
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          title="Cek booking segera dibuka"
          description="Halaman ini sedang dikerjakan."
        />
      </div>
    </CustomerLayout>
  )
}
