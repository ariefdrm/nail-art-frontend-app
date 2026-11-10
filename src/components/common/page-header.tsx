import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {description ? <p className="max-w-prose text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  )
}
