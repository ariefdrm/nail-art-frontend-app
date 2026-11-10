import { Link } from '@tanstack/react-router'

import { Wordmark } from '@/components/common/wordmark'

type CustomerLayoutProps = { children: React.ReactNode }

export function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="The Nail Palace, beranda">
            <Wordmark />
          </Link>
          {/* TODO(FE-1): add Layanan, Cek booking and Pesan once those routes exist. */}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          The Nail Palace, Jambi
        </div>
      </footer>
    </div>
  )
}
