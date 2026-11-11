import { cn } from '@/lib/utils'

const FILL: Record<number, string> = { 1: 'w-1/4', 2: 'w-2/4', 3: 'w-3/4', 4: 'w-full' }

type WizardProgressProps = { step: number; total: number; title: string }

/** Text plus a thin bar; deliberately not numbered circles (DESIGN_SPEC.md 5.8). */
export function WizardProgress({ step, total, title }: WizardProgressProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Langkah {step} dari {total}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-4 h-0.5 bg-border" aria-hidden>
        <div className={cn('h-full bg-foreground transition-all duration-200', FILL[step])} />
      </div>
    </div>
  )
}
