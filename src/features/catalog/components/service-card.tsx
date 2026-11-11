import { formatCategory, formatDuration, formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'

import { ServiceImage } from './service-image'

import type { Service } from '@/lib/api/types'

type ServiceCardProps = {
  service: Service
  /** Renders the card's interactive root, so the caller decides between a link and a button. */
  children: (content: React.ReactNode, className: string) => React.ReactNode
}

/** Presentational: no frame, no background (DESIGN_SPEC.md section 5.7). */
export function ServiceCard({ service, children }: ServiceCardProps) {
  const content = (
    <>
      <ServiceImage service={service} className="transition-opacity group-hover:opacity-90" />
      <span className="mt-4 block text-lg font-semibold group-hover:underline">{service.name}</span>
      <span className="mt-1 block text-sm text-muted-foreground">
        {formatCategory(service.category)}
      </span>
      <span className="block text-sm text-muted-foreground tabular-nums">
        {formatDuration(service.duration_minutes)}
      </span>
      <span className="mt-2 block font-medium tabular-nums">{formatRupiah(service.price)}</span>
    </>
  )
  return children(
    content,
    cn(
      'group block w-full rounded-md text-left outline-none',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    ),
  )
}
