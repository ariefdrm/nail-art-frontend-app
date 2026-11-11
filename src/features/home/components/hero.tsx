import { Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'

import { HeroVisual } from './hero-visual'

/** The home page's one loud moment: a large headline beside a picture of the business. */
export function Hero() {
  return (
    <section
      className="grid items-center gap-12 pt-12 pb-8 md:pt-20 md:pb-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16"
      aria-labelledby="hero-title"
    >
      <div>
        <h1
          id="hero-title"
          className="text-4xl leading-[1.1] font-semibold tracking-[-0.03em] md:text-6xl md:leading-[1.07]"
        >
          <span className="rise block">Nail art yang</span>
          <span className="rise rise-2 block">dirancang</span>
          <span className="rise rise-3 block">untuk Anda.</span>
        </h1>
        <p className="rise rise-3 mt-6 max-w-prose text-lg text-muted-foreground">
          Studio nail art di Kota Jambi. Pilih layanan, pilih jam, selesai.
        </p>
        <div className="rise rise-4 mt-10 flex flex-wrap gap-3">
          <Link to="/pesan" className={buttonVariants({ size: 'xl' })}>
            Pesan sekarang
          </Link>
          <Link to="/cek-booking" className={buttonVariants({ size: 'xl', variant: 'outline' })}>
            Cek booking
          </Link>
        </div>
      </div>
      <HeroVisual className="rise rise-4 mx-auto max-w-sm lg:max-w-none" />
    </section>
  )
}
