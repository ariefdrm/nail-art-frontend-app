import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/common/page-header'
import { CustomerLayout } from '@/layouts/customer-layout'

export const Route = createFileRoute('/')({ component: Home, ssr: false })

function Home() {
  return (
    <CustomerLayout>
      <PageHeader
        title="The Nail Palace"
        description="Studio nail art di Jambi. Halaman beranda lengkap hadir di modul berikutnya."
      />
    </CustomerLayout>
  )
}
