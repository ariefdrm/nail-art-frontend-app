import { Link } from '@tanstack/react-router'
import { ShieldOff } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'

import { EmptyState } from './empty-state'

/** The page for a signed-in person whose role does not allow this (DESIGN_SPEC 9, "Tanpa izin"). */
export function NoAccess() {
  return (
    <div className="mx-auto max-w-xl py-12">
      <EmptyState
        icon={<ShieldOff className="size-6" aria-hidden />}
        title="Anda tidak memiliki akses"
        description="Halaman ini hanya untuk pemilik studio."
        action={
          <Link to="/admin" className={buttonVariants({ variant: 'outline' })}>
            Kembali ke dashboard
          </Link>
        }
      />
    </div>
  )
}
