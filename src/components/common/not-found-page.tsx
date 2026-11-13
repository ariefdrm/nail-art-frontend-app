import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'

import { EmptyState } from './empty-state'

export function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <EmptyState
        headingLevel="h1"
        icon={<SearchX className="size-6" aria-hidden />}
        title="Halaman tidak ditemukan"
        description="Alamat yang Anda tuju tidak ada atau sudah dipindahkan."
        action={
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            Kembali ke beranda
          </Link>
        }
      />
    </div>
  )
}
