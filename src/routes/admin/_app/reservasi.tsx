import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import { PageHeader } from '@/components/common/page-header'
import { ReservationDetailSheet } from '@/features/reservations/components/reservation-detail-sheet'
import { ReservationFilters } from '@/features/reservations/components/reservation-filters'
import { ReservationList } from '@/features/reservations/components/reservation-list'
import { defaultRange, isBlankSearch } from '@/features/reservations/search'
import { useArtistsQuery } from '@/lib/api/public-queries'

const DAY = /^\d{4}-\d{2}-\d{2}$/

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  status: z
    .enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'])
    .optional()
    .catch(undefined),
  artist: z.string().uuid().optional().catch(undefined),
  dari: z.string().regex(DAY).optional().catch(undefined),
  sampai: z.string().regex(DAY).optional().catch(undefined),
  halaman: z.number().int().min(1).optional().catch(undefined),
  id: z.string().uuid().optional().catch(undefined),
})

export const Route = createFileRoute('/admin/_app/reservasi')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Reservasi | Admin | The Nail Palace' }] }),
  // Opening the page bare lands on today plus a week; after that the URL says what is shown.
  beforeLoad: ({ search }) => {
    if (isBlankSearch(search)) {
      throw redirect({ to: '/admin/reservasi', search: defaultRange(), replace: true })
    }
  },
  component: ReservationsPage,
  ssr: false,
})

function ReservationsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const artists = useArtistsQuery()

  return (
    <div className="space-y-6">
      <PageHeader title="Reservasi" />
      <ReservationFilters
        search={search}
        artists={artists.data}
        onChange={(next) => void navigate({ search: next })}
      />
      <ReservationList search={search} onSearchChange={(next) => void navigate({ search: next })} />
      <ReservationDetailSheet
        id={search.id}
        onClose={() => void navigate({ search: { ...search, id: undefined }, replace: true })}
      />
    </div>
  )
}
