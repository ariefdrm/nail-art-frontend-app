import { cn } from '@/lib/utils'

import { BookingPreview } from './booking-preview'
import { NailIllustration } from './nail-illustration'

type HeroVisualProps = { className?: string }

/**
 * The home page's picture of the business: nails (what the studio makes) above the booking
 * screen (how customers reach it). Same 4:5 frame as service photos, so a real photograph can
 * replace the illustration later without changing the layout (DESIGN_SPEC.md section 8).
 */
export function HeroVisual({ className }: HeroVisualProps) {
  return (
    <div
      role="img"
      aria-label="Ilustrasi kuku dan tampilan pilih jam pada halaman pemesanan"
      className={cn(
        'media relative flex aspect-[4/5] w-full flex-col justify-between gap-8 overflow-hidden rounded-md border border-border bg-background p-6 sm:p-10',
        className,
      )}
    >
      <NailIllustration className="mt-6" />
      <BookingPreview />
    </div>
  )
}
