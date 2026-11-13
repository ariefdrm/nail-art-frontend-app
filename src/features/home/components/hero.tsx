import { Link } from '@tanstack/react-router'
import { CalendarCheck, ShieldCheck, UserRoundX } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'

import { HeroLiveSlots } from './hero-live-slots'

const PROMISES = [
  { icon: CalendarCheck, text: 'Hanya jam yang benar-benar kosong yang tampil' },
  { icon: UserRoundX, text: 'Tanpa akun dan tanpa kata sandi' },
  { icon: ShieldCheck, text: 'Setiap pesanan dikonfirmasi pemilik studio' },
] as const

/** The home page's one loud moment: a large headline beside the studio's real open times. */
export function Hero() {
  return (
    <section
      className="grid items-center gap-12 pt-12 pb-16 md:pt-20 md:pb-24 lg:grid-cols-[1.2fr_1fr] lg:gap-20"
      aria-labelledby="hero-title"
    >
      <div>
        <h1
          id="hero-title"
          className="font-display text-5xl leading-[1.02] font-medium tracking-[-0.03em] md:text-7xl"
        >
          <span className="line-mask">
            <span className="line-up">Nail art,</span>
          </span>
          <span className="line-mask">
            <span className="line-up" style={{ '--i': 1 } as React.CSSProperties}>
              dengan jam
            </span>
          </span>
          <span className="line-mask">
            <span className="line-up" style={{ '--i': 2 } as React.CSSProperties}>
              yang pasti.
            </span>
          </span>
        </h1>
        <p className="rise rise-3 mt-8 max-w-prose text-lg text-muted-foreground">
          Studio nail art di Kota Jambi. Lihat layanan dan harganya, pilih jam yang masih kosong,
          lalu pesan tanpa bolak-balik chat.
        </p>
        <div className="rise rise-4 mt-10 flex flex-wrap gap-3">
          <Link to="/pesan" className={buttonVariants({ size: 'xl' })}>
            Pesan sekarang
          </Link>
          <Link to="/cek-booking" className={buttonVariants({ size: 'xl', variant: 'outline' })}>
            Cek booking
          </Link>
        </div>
        <ul className="rise rise-4 mt-12 grid gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          {PROMISES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <Icon className="size-4 shrink-0 text-foreground" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <HeroLiveSlots className="rise rise-4" />
    </section>
  )
}
