import {
  CalendarClock,
  CalendarDays,
  Download,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export type AdminNavItem = {
  to:
    | '/admin'
    | '/admin/reservasi'
    | '/admin/layanan'
    | '/admin/artist'
    | '/admin/jadwal'
    | '/admin/ekspor'
    | '/admin/pengaturan'
  label: string
  icon: LucideIcon
  exact: boolean
  /** Hidden from staff: the API refuses them (403). */
  ownerOnly?: boolean
}

/**
 * Admin navigation. A module adds its entry here in the same change that adds its route
 * (typed links need the route to exist).
 */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/reservasi', label: 'Reservasi', icon: CalendarDays, exact: false },
  { to: '/admin/layanan', label: 'Layanan', icon: Sparkles, exact: false },
  { to: '/admin/artist', label: 'Artist', icon: Users, exact: false },
  { to: '/admin/jadwal', label: 'Jadwal', icon: CalendarClock, exact: false },
  { to: '/admin/ekspor', label: 'Ekspor', icon: Download, exact: false, ownerOnly: true },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, exact: false },
]
