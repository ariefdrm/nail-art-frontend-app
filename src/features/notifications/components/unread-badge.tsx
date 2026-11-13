import { useUnreadCountQuery } from '@/features/notifications/queries'
import { cn } from '@/lib/utils'

const MAX_SHOWN = 99

type UnreadBadgeProps = { className?: string }

/** The count of unread notifications as a small filled pill; nothing when there are none. */
export function UnreadBadge({ className }: UnreadBadgeProps) {
  const query = useUnreadCountQuery()
  const unread = query.data ?? 0
  if (unread <= 0) return null

  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground tabular-nums',
        className,
      )}
    >
      {unread > MAX_SHOWN ? `${MAX_SHOWN}+` : unread}
      <span className="sr-only"> belum dibaca</span>
    </span>
  )
}
