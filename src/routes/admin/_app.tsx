import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

import { Wordmark } from '@/components/common/wordmark'
import { meOptions } from '@/features/auth/queries'
import { AdminLayout } from '@/layouts/admin-layout'
import { toApiError } from '@/lib/api/errors'
import { bootstrapSession } from '@/lib/auth/session'

export const Route = createFileRoute('/admin/_app')({
  head: () => ({
    meta: [{ title: 'Admin | The Nail Palace' }, { name: 'robots', content: 'noindex' }],
  }),
  // The guard: nothing under /admin renders until the session is known (DESIGN_SPEC 9 "Memeriksa sesi").
  beforeLoad: async ({ context, location }) => {
    const isSignedIn = await bootstrapSession()
    if (!isSignedIn) {
      throw redirect({ to: '/admin/login', search: { lanjut: location.href } })
    }
    try {
      const admin = await context.queryClient.ensureQueryData(meOptions())
      return { admin }
    } catch (error) {
      if (toApiError(error).status === 401) {
        throw redirect({ to: '/admin/login', search: { sesi: 'berakhir' } })
      }
      throw error
    }
  },
  pendingMs: 0,
  pendingComponent: CheckingSession,
  component: AdminShell,
  ssr: false,
})

function CheckingSession() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex min-h-screen flex-col items-center justify-center gap-4"
    >
      <Wordmark />
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">Memeriksa sesi</span>
    </div>
  )
}

function AdminShell() {
  const { admin } = Route.useRouteContext()
  return (
    <AdminLayout admin={admin}>
      <Outlet />
    </AdminLayout>
  )
}
