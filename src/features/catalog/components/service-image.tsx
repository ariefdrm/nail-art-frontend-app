import { cn } from '@/lib/utils'

import type { Service } from '@/lib/api/types'

type ServiceImageProps = {
  service: Pick<Service, 'name' | 'image_url'>
  className?: string
}

/**
 * Fixed 4:5 frame. The photo is the only color on the page; without one, the service's initial
 * stands in at display size (DESIGN_SPEC.md section 8).
 */
export function ServiceImage({ service, className }: ServiceImageProps) {
  return (
    <div
      className={cn(
        'media relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-muted',
        className,
      )}
    >
      {service.image_url ? (
        <img
          src={service.image_url}
          alt={service.name}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-7xl font-semibold tracking-tight text-muted-foreground/40 select-none"
        >
          {service.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}
