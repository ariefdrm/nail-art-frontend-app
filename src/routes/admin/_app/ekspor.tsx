import { createFileRoute } from '@tanstack/react-router'

import { NoAccess } from '@/components/common/no-access'
import { ExportPanel } from '@/features/export/components/export-panel'

export const Route = createFileRoute('/admin/_app/ekspor')({
  head: () => ({ meta: [{ title: 'Ekspor | Admin | The Nail Palace' }] }),
  component: ExportPage,
  ssr: false,
})

function ExportPage() {
  const { admin } = Route.useRouteContext()
  // The API answers 403 to staff; hiding the page up front spares them a pointless download.
  return admin.role === 'owner' ? <ExportPanel /> : <NoAccess />
}
