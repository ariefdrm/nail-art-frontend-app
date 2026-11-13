import { Link } from '@tanstack/react-router'
import { Bell } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { useUnreadCountQuery } from '@/features/notifications/queries'

import { UnreadBadge } from './unread-badge'

/** Top bar bell: the way to the inbox, with the unread count that is refreshed every 30 seconds. */
export function NotificationBell() {
  const unread = useUnreadCountQuery().data ?? 0

  return (
    <Link
      to="/admin/notifikasi"
      aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
      className={`${buttonVariants({ variant: 'ghost', size: 'icon-lg' })} relative`}
    >
      <Bell aria-hidden />
      {unread > 0 ? (
        <span className="absolute -top-0.5 -right-0.5" aria-hidden>
          <UnreadBadge />
        </span>
      ) : null}
    </Link>
  )
}
