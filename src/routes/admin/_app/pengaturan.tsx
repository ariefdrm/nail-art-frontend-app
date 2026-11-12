import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PageHeader } from '@/components/common/page-header'
import { ConfirmLogoutAll } from '@/features/auth/components/confirm-logout-all'

export const Route = createFileRoute('/admin/_app/pengaturan')({
  head: () => ({ meta: [{ title: 'Pengaturan | Admin | The Nail Palace' }] }),
  component: SettingsPage,
  ssr: false,
})

function SettingsPage() {
  const navigate = useNavigate()
  return (
    <div className="max-w-xl space-y-8">
      <PageHeader title="Pengaturan" />
      <section aria-labelledby="session-title" className="space-y-3">
        <h2 id="session-title" className="text-2xl font-semibold tracking-tight">
          Sesi
        </h2>
        <p className="text-muted-foreground">
          Keluar dari semua perangkat bila Anda curiga ada yang memakai akun Anda.
        </p>
        <ConfirmLogoutAll
          onDone={() => void navigate({ to: '/admin/login', search: {}, replace: true })}
        />
      </section>
    </div>
  )
}
