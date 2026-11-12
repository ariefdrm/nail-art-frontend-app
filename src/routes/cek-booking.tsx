import { createFileRoute } from '@tanstack/react-router'

import { BookingLookup } from '@/features/booking-lookup/components/booking-lookup'
import { CustomerLayout } from '@/layouts/customer-layout'

export const Route = createFileRoute('/cek-booking')({
  head: () => ({ meta: [{ title: 'Cek booking | The Nail Palace' }] }),
  component: LookupPage,
  ssr: false,
})

function LookupPage() {
  return (
    <CustomerLayout>
      <BookingLookup />
    </CustomerLayout>
  )
}
