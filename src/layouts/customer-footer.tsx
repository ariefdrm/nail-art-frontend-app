import { Link } from '@tanstack/react-router'

import { Wordmark } from '@/components/common/wordmark'

import { CONTAINER, NAV_ITEMS } from './customer-nav'

const LINK =
  'inline-flex min-h-11 items-center rounded-md text-sm text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function CustomerFooter() {
  return (
    <footer className="border-t border-border">
      <div className={`${CONTAINER} grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1.4fr] md:gap-12`}>
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-sm text-muted-foreground">
            Studio nail art di Kota Jambi. Pesan jam Anda dari mana saja, tanpa akun.
          </p>
        </div>

        <nav aria-label="Tautan footer">
          <h2 className="text-sm font-semibold">Jelajahi</h2>
          <ul className="mt-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={LINK}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/pesan" className={LINK}>
                Pesan sekarang
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold">Tentang pemesanan</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Pemilik studio mengonfirmasi setiap pesanan. Simpan kode booking dan nomor HP Anda untuk
            mengecek atau membatalkan pesanan.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className={`${CONTAINER} py-6 text-sm text-muted-foreground`}>
          © {new Date().getFullYear()} The Nail Palace
        </div>
      </div>
    </footer>
  )
}
