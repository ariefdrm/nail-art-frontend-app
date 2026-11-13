import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Inbox } from '@/features/notifications/components/inbox'

const searchSchema = z.object({
  belum: z.boolean().optional().catch(undefined),
  halaman: z.number().int().min(1).optional().catch(undefined),
})

export const Route = createFileRoute('/admin/_app/notifikasi')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Notifikasi | Admin | The Nail Palace' }] }),
  component: NotificationsPage,
  ssr: false,
})

function NotificationsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return <Inbox search={search} onSearchChange={(next) => void navigate({ search: next })} />
}
