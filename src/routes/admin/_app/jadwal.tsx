import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PageHeader } from '@/components/common/page-header'
import { SegmentedControl } from '@/components/common/segmented-control'
import { BlocksPanel } from '@/features/schedule/components/blocks-panel'
import { HoursPanel } from '@/features/schedule/components/hours-panel'

const searchSchema = z.object({
  tab: z.enum(['blokir']).optional().catch(undefined),
  baru: z.boolean().optional().catch(undefined),
  lewat: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/admin/_app/jadwal')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Jadwal | Admin | The Nail Palace' }] }),
  component: SchedulePage,
  ssr: false,
})

type Tab = 'jam' | 'blokir'

function SchedulePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const tab: Tab = search.tab ?? 'jam'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal"
        description="Atur jam buka studio dan tutup waktu tertentu untuk libur atau cuti."
        actions={
          <SegmentedControl<Tab>
            label="Bagian jadwal"
            value={tab}
            onChange={(next) =>
              void navigate({ search: { tab: next === 'blokir' ? 'blokir' : undefined } })
            }
            options={[
              { value: 'jam', label: 'Jam operasional' },
              { value: 'blokir', label: 'Blokir waktu' },
            ]}
          />
        }
      />
      {tab === 'jam' ? (
        <HoursPanel />
      ) : (
        <BlocksPanel
          search={{ baru: search.baru, lewat: search.lewat }}
          onSearchChange={(next) => void navigate({ search: { tab: 'blokir', ...next } })}
        />
      )}
    </div>
  )
}
