import { cn } from '@/lib/utils'

type Nail = { cx: number; height: number; filled?: boolean }

const HALF_WIDTH = 14
const BASELINE = 150

/** Five almond-shaped tips, thumb to little finger. One is polished solid; the rest are outlines. */
const NAILS: Nail[] = [
  { cx: 30, height: 70 },
  { cx: 75, height: 98 },
  { cx: 120, height: 112, filled: true },
  { cx: 165, height: 96 },
  { cx: 210, height: 72 },
]

type NailIllustrationProps = { className?: string }

function almondPath({ cx, height }: Nail): string {
  const top = BASELINE - height
  const shoulder = top + 38
  const curve = 18
  return [
    `M${cx - HALF_WIDTH} ${BASELINE}`,
    `V${shoulder}`,
    `C${cx - HALF_WIDTH} ${top + curve} ${cx - 6} ${top} ${cx} ${top}`,
    `C${cx + 6} ${top} ${cx + HALF_WIDTH} ${top + curve} ${cx + HALF_WIDTH} ${shoulder}`,
    `V${BASELINE}`,
    'Z',
  ].join(' ')
}

/** Decorative line art. Drawn with token classes only, so a restyle in styles.css restyles it. */
export function NailIllustration({ className }: NailIllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 160"
      aria-hidden
      focusable="false"
      className={cn('w-full', className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="0" y1={BASELINE + 5} x2="240" y2={BASELINE + 5} className="stroke-border" />
      {NAILS.map((nail) => {
        const top = BASELINE - nail.height
        return (
          <g key={nail.cx}>
            <path
              d={almondPath(nail)}
              className={cn(
                'stroke-foreground',
                nail.filled ? 'fill-foreground' : 'fill-background',
              )}
              strokeWidth="1"
            />
            {/* Gloss highlight */}
            <path
              d={`M${nail.cx - 6} ${top + 34} v${Math.min(30, nail.height / 3)}`}
              className={nail.filled ? 'stroke-background' : 'stroke-input'}
              strokeWidth="1.5"
            />
          </g>
        )
      })}
    </svg>
  )
}
