import { cn } from '@/lib/utils'

type BookingCodeProps = { code: string; className?: string }

export function BookingCode({ code, className }: BookingCodeProps) {
  return <span className={cn('font-mono tracking-wider', className)}>{code}</span>
}
