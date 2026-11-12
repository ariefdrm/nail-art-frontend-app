import { CheckCheck, CircleCheck, CircleX, Clock, TriangleAlert, UserX } from 'lucide-react'

import { STATUS_LABEL } from '@/lib/copy'
import { cn } from '@/lib/utils'

import type { BookingStatus } from '@/lib/api/types'

/** Shape and icon carry the status, not color (DESIGN_SPEC.md section 6). */
const STATUS_STYLE: Record<BookingStatus, { icon: typeof Clock; className: string }> = {
  pending: { icon: Clock, className: 'border border-foreground bg-background text-foreground' },
  confirmed: { icon: CircleCheck, className: 'bg-primary text-primary-foreground' },
  completed: { icon: CheckCheck, className: 'bg-secondary text-foreground' },
  cancelled: {
    icon: CircleX,
    className: 'border border-dashed border-input bg-background text-muted-foreground',
  },
  no_show: {
    icon: UserX,
    className: 'border border-dashed border-foreground bg-muted text-foreground',
  },
}

/** The icon that stands for each status, for views that cannot fit the full badge. */
export const STATUS_ICON: Record<BookingStatus, typeof Clock> = {
  pending: STATUS_STYLE.pending.icon,
  confirmed: STATUS_STYLE.confirmed.icon,
  completed: STATUS_STYLE.completed.icon,
  cancelled: STATUS_STYLE.cancelled.icon,
  no_show: STATUS_STYLE.no_show.icon,
}

type StatusBadgeProps = { status: BookingStatus; className?: string }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { icon: Icon, className: style } = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
        style,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function ScheduleConflictBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full border-2 border-foreground px-2.5 text-xs font-semibold whitespace-nowrap',
        className,
      )}
    >
      <TriangleAlert className="size-3.5" aria-hidden />
      Bentrok jadwal
    </span>
  )
}
