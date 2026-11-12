import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Wordmark } from '@/components/common/wordmark'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { UserBar } from '@/features/auth/components/user-bar'
import { useLogoutMutation } from '@/features/auth/queries'
import { onSessionExpired } from '@/lib/auth/session'
import { getAccessToken, subscribeSession } from '@/lib/auth/token-store'
import { cn } from '@/lib/utils'

import { ADMIN_NAV_ITEMS } from './admin-nav'

import type { Admin } from '@/lib/api/types'

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const NAV_LINK = cn(
  'flex h-10 items-center gap-3 border-l-2 border-transparent px-4 text-sm font-medium text-sidebar-foreground',
  'hover:bg-sidebar-accent [&.active]:border-sidebar-primary [&.active]:bg-sidebar-accent [&.active]:font-semibold',
  FOCUS,
)

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col py-2">
      {ADMIN_NAV_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact }}
          className={NAV_LINK}
          onClick={onNavigate}
        >
          <item.icon className="size-5" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

type AdminLayoutProps = { admin: Admin; children: React.ReactNode }

export function AdminLayout({ admin, children }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useLogoutMutation()
  const hasExpired = useRef(false)

  // The session can end without this tab doing anything: a refresh that was rejected, or a logout
  // in another tab. Either way, leave the admin area and forget cached data.
  useEffect(() => {
    const offExpired = onSessionExpired(() => {
      hasExpired.current = true
    })
    const offSession = subscribeSession(() => {
      if (getAccessToken() !== null) return
      queryClient.clear()
      void navigate({
        to: '/admin/login',
        search: hasExpired.current ? { sesi: 'berakhir' } : {},
        replace: true,
      })
    })
    return () => {
      offExpired()
      offSession()
    }
  }, [navigate, queryClient])

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => void navigate({ to: '/admin/login', search: {}, replace: true }),
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#konten"
        className="sr-only rounded-md border border-border bg-background px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Lewati ke konten
      </a>

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Wordmark />
        </div>
        <NavLinks />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:justify-end md:px-6">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="md:hidden"
                  aria-label="Buka menu"
                />
              }
            >
              <Menu aria-hidden />
            </SheetTrigger>
            <SheetContent side="left" className="gap-0 bg-sidebar">
              <SheetTitle className="flex h-14 items-center border-b border-sidebar-border px-4">
                <Wordmark />
              </SheetTitle>
              <NavLinks onNavigate={() => setIsMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <UserBar admin={admin} onLogout={handleLogout} isLoggingOut={logout.isPending} />
        </header>
        <main id="konten" tabIndex={-1} className="flex-1 p-4 outline-none md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
