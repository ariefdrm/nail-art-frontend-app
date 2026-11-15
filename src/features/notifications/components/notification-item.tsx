import { Link } from '@tanstack/react-router'

import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

import { NotificationIcon } from './notification-icon'

import type { Notification } from '@/lib/api/types'

const ROW =
  'flex w-full items-start gap-4 border-b border-l-4 border-b-border px-4 py-4 text-left outline-none last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'

type NotificationItemProps = {
  notification: Notification
  /** Called when the item is opened, so an unread one can be marked read. */
  onOpen: (notification: Notification) => void
}

function rowEdge(isUnread: boolean) {
  return isUnread ? 'border-l-primary bg-muted/40' : 'border-l-transparent'
}

function Content({ notification }: { notification: Notification }) {
  const isUnread = !notification.read
  return (
    <>
      <NotificationIcon type={notification.type} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className={cn(isUnread ? 'font-semibold' : 'text-muted-foreground')}>
            {notification.title}
          </span>
          <time
            dateTime={notification.created_at}
            className="shrink-0 text-xs text-muted-foreground tabular-nums"
          >
            {formatRelativeTime(notification.created_at)}
          </time>
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{notification.body}</span>
      </span>
      {isUnread ? (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      ) : null}
      {isUnread ? <span className="sr-only">Belum dibaca</span> : null}
    </>
  )
}

export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  // One that belongs to a reservation opens it; otherwise there is nothing to open, only to read.
  if (notification.booking_id) {
    return (
      <li>
        <Link
          to="/admin/reservasi"
          search={{ id: notification.booking_id }}
          className={cn(ROW, rowEdge(!notification.read))}
          onClick={() => onOpen(notification)}
        >
          <Content notification={notification} />
        </Link>
      </li>
    )
  }
  return (
    <li>
      {notification.read ? (
        <div className={cn(ROW, rowEdge(false), 'hover:bg-transparent')}>
          <Content notification={notification} />
        </div>
      ) : (
        <button
          type="button"
          className={cn(ROW, rowEdge(true))}
          onClick={() => onOpen(notification)}
        >
          <Content notification={notification} />
        </button>
      )}
    </li>
  )
}
