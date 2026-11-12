import { CircleCheck, CircleSlash } from 'lucide-react'

import { cn } from '@/lib/utils'

type ActiveBadgeProps = { isActive: boolean; className?: string }

/** Aktif / Nonaktif by icon, text and outline style, never by color alone. */
export function ActiveBadge({ isActive, className }: ActiveBadgeProps) {
  const Icon = isActive ? CircleCheck : CircleSlash
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
        isActive
          ? 'border border-foreground bg-background text-foreground'
          : 'border border-dashed border-input bg-background text-muted-foreground',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {isActive ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}
