import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/common/page-header'

// TODO(FE-9): replace with the dashboard.
export const Route = createFileRoute('/admin/_app/')({ component: AdminHome, ssr: false })

function AdminHome() {
  const { admin } = Route.useRouteContext()
  return (
    <PageHeader
      title={`Halo, ${admin.name}`}
      description="Dashboard dan menu pengelolaan akan hadir bertahap di sini."
    />
  )
}
