import { createFileRoute, useLocation } from '@tanstack/react-router'

import { BookingSuccess } from '@/features/booking/components/booking-success'
import { CustomerLayout } from '@/layouts/customer-layout'

export const Route = createFileRoute('/pesan/berhasil')({
  component: BookingSuccessPage,
  ssr: false,
})

function BookingSuccessPage() {
  const booking = useLocation({ select: (location) => location.state.booking })
  return (
    <CustomerLayout>
      <BookingSuccess booking={booking} />
    </CustomerLayout>
  )
}
