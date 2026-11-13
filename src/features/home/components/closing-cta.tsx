import { Link } from '@tanstack/react-router'

import { Reveal } from '@/components/common/reveal'
import { buttonVariants } from '@/components/ui/button'

import { Spotlight } from './spotlight'

/** The last word on the page: a solid black panel that points at the one action. */
export function ClosingCta() {
  return (
    <section className="pb-16 md:pb-24" aria-labelledby="closing-title">
      <Reveal>
        <Spotlight className="rounded-xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 md:py-20">
          <h2
            id="closing-title"
            className="max-w-2xl font-display text-4xl leading-[1.05] font-medium tracking-tight md:text-6xl"
          >
            Pilih jam Anda, kami siapkan kukunya.
          </h2>
          <p className="mt-6 max-w-prose text-primary-foreground/70">
            Pesan dalam beberapa langkah. Sudah punya kode booking? Cek atau batalkan kapan saja.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/pesan"
              className={buttonVariants({
                size: 'xl',
                className:
                  'bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:ring-primary-foreground focus-visible:ring-offset-primary',
              })}
            >
              Pesan sekarang
            </Link>
            <Link
              to="/cek-booking"
              className={buttonVariants({
                size: 'xl',
                variant: 'outline',
                className:
                  'border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground focus-visible:ring-offset-primary',
              })}
            >
              Cek booking
            </Link>
          </div>
        </Spotlight>
      </Reveal>
    </section>
  )
}
