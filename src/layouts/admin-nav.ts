import {
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'

/**
 * Admin navigation. A module adds its entry here in the same change that adds its route
 * (typed links need the route to exist).
 */
export const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/reservasi', label: 'Reservasi', icon: CalendarDays, exact: false },
  { to: '/admin/layanan', label: 'Layanan', icon: Sparkles, exact: false },
  { to: '/admin/artist', label: 'Artist', icon: Users, exact: false },
  { to: '/admin/jadwal', label: 'Jadwal', icon: CalendarClock, exact: false },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, exact: false },
] as const
