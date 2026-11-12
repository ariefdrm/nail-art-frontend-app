import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { ServicesAdmin } from '@/features/admin-services/components/service-list'

const searchSchema = z.object({
  id: z.string().uuid().optional().catch(undefined),
  baru: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/admin/_app/layanan')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Layanan | Admin | The Nail Palace' }] }),
  component: ServicesPage,
  ssr: false,
})

function ServicesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <ServicesAdmin search={search} onSearchChange={(next) => void navigate({ search: next })} />
  )
}
