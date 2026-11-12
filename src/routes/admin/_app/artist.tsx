import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { ArtistsAdmin } from '@/features/admin-artists/components/artist-list'

const searchSchema = z.object({
  id: z.string().uuid().optional().catch(undefined),
  baru: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/admin/_app/artist')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Artist | Admin | The Nail Palace' }] }),
  component: ArtistsPage,
  ssr: false,
})

function ArtistsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return <ArtistsAdmin search={search} onSearchChange={(next) => void navigate({ search: next })} />
}
