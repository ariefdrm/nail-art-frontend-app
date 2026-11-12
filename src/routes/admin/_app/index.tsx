import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { DashboardView } from '@/features/dashboard/components/dashboard-view'

const DAY = /^\d{4}-\d{2}-\d{2}$/

const searchSchema = z.object({
  dari: z.string().regex(DAY).optional().catch(undefined),
  sampai: z.string().regex(DAY).optional().catch(undefined),
})

export const Route = createFileRoute('/admin/_app/')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Dashboard | Admin | The Nail Palace' }] }),
  component: AdminHome,
  ssr: false,
})

function AdminHome() {
  const { admin } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <DashboardView
      adminName={admin.name}
      search={search}
      onSearchChange={(next) => void navigate({ search: next, replace: true })}
    />
  )
}
