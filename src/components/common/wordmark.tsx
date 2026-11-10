import { cn } from '@/lib/utils'

type WordmarkProps = { className?: string }

export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={cn('text-sm font-semibold tracking-[0.2em] uppercase', className)}>
      The Nail Palace
    </span>
  )
}
