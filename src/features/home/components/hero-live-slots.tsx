import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { useNextSlots } from '@/features/home/use-next-slots'
import { useServicesQuery } from '@/lib/api/public-queries'
import { addDaysWib, formatDayKey, formatDuration, formatRupiah, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

import { HeroVisual } from './hero-visual'

import type { Service } from '@/lib/api/types'

const MAX_TIMES = 6
const MAX_SERVICES = 4

const FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary'

function dayLabel(day: string, today: string): string {
  if (day === today) return 'Hari ini'
  if (day === addDaysWib(today, 1)) return 'Besok'
  return formatDayKey(day)
}

function SlotList({ service }: { service: Service }) {
  const { isPending, next, today } = useNextSlots(service)

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Memuat jam kosong" className="space-y-4">
        <Skeleton className="h-9 w-40 bg-primary-foreground/15" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11 bg-primary-foreground/15" />
          ))}
        </div>
      </div>
    )
  }

  if (!next) {
    return (
      <p className="stagger-in text-primary-foreground/70">
        Belum ada jam kosong dalam beberapa hari ke depan. Coba pilih tanggal lain di halaman
        pemesanan.
      </p>
    )
  }

  return (
    <div>
      <p className="stagger-in font-display text-3xl leading-tight font-medium tracking-tight">
        {dayLabel(next.day, today)}
      </p>
      <ul className="mt-5 grid grid-cols-3 gap-2" aria-label={`Jam kosong ${service.name}`}>
        {next.slots.slice(0, MAX_TIMES).map((slot, index) => (
          <li
            key={slot.start_at}
            className="stagger-in"
            style={{ '--i': index } as React.CSSProperties}
          >
            <Link
              to="/pesan"
              search={{ layanan: service.id }}
              aria-label={`Pesan ${service.name} pukul ${formatTime(slot.start_at)}`}
              className={cn(
                'flex h-11 items-center justify-center rounded-full border border-primary-foreground/40 text-sm font-medium tabular-nums transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-foreground hover:text-primary',
                FOCUS,
              )}
            >
              {formatTime(slot.start_at)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LiveSlotsPanel({ services }: { services: Service[] }) {
  const choices = services.slice(0, MAX_SERVICES)
  const [selectedId, setSelectedId] = useState(choices[0]?.id)
  const selected = choices.find((service) => service.id === selectedId) ?? choices[0]
  if (!selected) return null

  return (
    <div className="rounded-xl bg-primary p-6 text-primary-foreground sm:p-8">
      <p className="text-sm text-primary-foreground/70">Jam kosong terdekat</p>

      <div role="group" aria-label="Pilih layanan" className="mt-4 flex flex-wrap gap-2">
        {choices.map((service) => (
          <button
            key={service.id}
            type="button"
            aria-pressed={service.id === selected.id}
            onClick={() => setSelectedId(service.id)}
            className={cn(
              'min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors duration-300',
              service.id === selected.id
                ? 'border-primary-foreground bg-primary-foreground text-primary'
                : 'border-primary-foreground/30 hover:border-primary-foreground/70',
              FOCUS,
            )}
          >
            {service.name}
          </button>
        ))}
      </div>

      <div className="mt-6 min-h-44" aria-live="polite">
        <SlotList key={selected.id} service={selected} />
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-primary-foreground/20 pt-4 text-sm">
        <p className="text-primary-foreground/70 tabular-nums">
          {formatDuration(selected.duration_minutes)}
        </p>
        <p className="font-medium tabular-nums">{formatRupiah(selected.price)}</p>
      </div>
    </div>
  )
}

/**
 * The hero's right side: real open times, with a switch between services, so the page proves the
 * promise in its headline. Falls back to the illustration while the catalog loads or is empty.
 */
export function HeroLiveSlots({ className }: { className?: string }) {
  const services = useServicesQuery()

  return (
    <div className={className}>
      {services.data && services.data.length > 0 ? (
        <LiveSlotsPanel services={services.data} />
      ) : (
        <HeroVisual className="mx-auto max-w-sm lg:max-w-none" />
      )}
    </div>
  )
}
