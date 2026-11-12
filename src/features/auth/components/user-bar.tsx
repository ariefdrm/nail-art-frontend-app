import { Loader2, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { Admin } from '@/lib/api/types'

const ROLE_LABEL: Record<string, string> = { owner: 'Pemilik', staff: 'Staf' }

type UserBarProps = { admin: Admin; onLogout: () => void; isLoggingOut: boolean }

/** Who is signed in, and the way out. Always visible: signing out should never be a hunt. */
export function UserBar({ admin, onLogout, isLoggingOut }: UserBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="max-w-48 truncate text-sm font-medium">{admin.name}</p>
        <p className="text-xs text-muted-foreground">{ROLE_LABEL[admin.role] ?? admin.role}</p>
      </div>
      <Button type="button" variant="outline" onClick={onLogout} disabled={isLoggingOut}>
        {isLoggingOut ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
        {isLoggingOut ? 'Keluar...' : 'Keluar'}
      </Button>
    </div>
  )
}
