import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'

import { Wordmark } from '@/components/common/wordmark'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import { CONTAINER, MAIN_ID, NAV_ITEMS } from './customer-nav'

const FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

/** Fills the header's height so the active bar sits on its bottom edge. */
const DESKTOP_LINK = `flex h-full items-center border-b-2 border-transparent px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:border-foreground [&.active]:text-foreground ${FOCUS}`

const MENU_LINK = `flex h-14 items-center border-b border-border px-6 text-lg font-medium [&.active]:font-semibold ${FOCUS}`

export function CustomerHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <a
        href={`#${MAIN_ID}`}
        className="sr-only rounded-md border border-border bg-background px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Lewati ke konten
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className={`${CONTAINER} flex h-16 items-stretch justify-between gap-6`}>
          <Link
            to="/"
            aria-label="The Nail Palace, beranda"
            className={`flex items-center rounded-md ${FOCUS}`}
          >
            <Wordmark />
          </Link>

          <nav aria-label="Utama" className="hidden items-stretch gap-8 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link key={item.to} to={item.to} className={DESKTOP_LINK}>
                {item.label}
              </Link>
            ))}
            <span className="flex items-center">
              <Link to="/pesan" className={buttonVariants({ size: 'lg' })}>
                Pesan
              </Link>
            </span>
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <Link to="/pesan" className={buttonVariants({ size: 'lg' })}>
              Pesan
            </Link>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger
                render={<Button variant="ghost" size="icon-lg" aria-label="Buka menu" />}
              >
                <Menu aria-hidden />
              </SheetTrigger>
              <SheetContent side="left" className="gap-0">
                <SheetTitle className="flex h-16 items-center border-b border-border px-6">
                  <Wordmark />
                </SheetTitle>
                <nav aria-label="Menu" className="flex flex-col">
                  <Link to="/" className={MENU_LINK} onClick={() => setIsMenuOpen(false)}>
                    Beranda
                  </Link>
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={MENU_LINK}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
