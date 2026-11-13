import { cn } from '@/lib/utils'

type SpotlightProps = { children: React.ReactNode; className?: string }

/** A panel whose light follows the pointer. Touch and keyboard users just see the resting light. */
export function Spotlight({ children, className }: SpotlightProps) {
  return (
    <div
      className={cn('spotlight', className)}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return
        const box = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--x', `${event.clientX - box.left}px`)
        event.currentTarget.style.setProperty('--y', `${event.clientY - box.top}px`)
      }}
    >
      {children}
    </div>
  )
}
