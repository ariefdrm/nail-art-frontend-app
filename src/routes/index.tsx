import { createFileRoute } from '@tanstack/react-router'

import { FeaturedServices } from '@/features/catalog/components/featured-services'
import { ClosingCta } from '@/features/home/components/closing-cta'
import { Faq } from '@/features/home/components/faq'
import { Hero } from '@/features/home/components/hero'
import { HowToOrder } from '@/features/home/components/how-to-order'
import { ServiceMarquee } from '@/features/home/components/service-marquee'
// from '@/features/home/components/how-to-order'
import { CustomerLayout } from '@/layouts/customer-layout'

export const Route = createFileRoute('/')({ component: Home, ssr: false })

function Home() {
  return (
    <CustomerLayout>
      <Hero />
      <ServiceMarquee />
      <FeaturedServices />
      <HowToOrder />
      <Faq />
      <ClosingCta />
    </CustomerLayout>
  )
}
