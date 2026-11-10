import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
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
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
