import { createFileRoute } from '@tanstack/react-router'

import { FeaturedServices } from '@/features/catalog/components/featured-services'
import { Hero } from '@/features/home/components/hero'
import { HowToOrder } from '@/features/home/components/how-to-order'
import { CustomerLayout } from '@/layouts/customer-layout'

export const Route = createFileRoute('/')({ component: Home, ssr: false })

function Home() {
  return (
    <CustomerLayout>
      <Hero />
      <FeaturedServices />
      <HowToOrder />
    </CustomerLayout>
  )
}
