import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
  /** A page that is only this message needs it as the page's h1. */
  headingLevel?: 'h1' | 'h2'
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  headingLevel: Heading = 'h2',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-border px-6 py-12 text-center',
        className,
      )}
    >
      <span className="text-muted-foreground">
        {icon ?? <Inbox className="size-6" aria-hidden />}
      </span>
      <Heading className="text-lg font-semibold">{title}</Heading>
      {description ? (
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
