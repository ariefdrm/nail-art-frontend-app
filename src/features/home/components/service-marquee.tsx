import { Sparkles } from 'lucide-react'

import { useServicesQuery } from '@/lib/api/public-queries'

/** Decorative strip of service names that drifts sideways; pauses on hover. Hidden from readers. */
export function ServiceMarquee() {
  const { data } = useServicesQuery()
  if (!data || data.length === 0) return null

  const names = data.map((service) => service.name)
  // Repeat enough times that one half is wider than a wide screen, then twice for a seamless loop.
  const half = Array.from({ length: Math.ceil(8 / names.length) }, () => names).flat()

  return (
    <div aria-hidden className="marquee overflow-hidden border-y border-border py-6">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {half.map((name, index) => (
              <li
                key={`${name}-${index}`}
                className="flex items-center gap-8 pr-8 font-display text-3xl font-medium tracking-tight whitespace-nowrap md:text-4xl"
              >
                {name}
                <Sparkles className="size-5 text-muted-foreground" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
