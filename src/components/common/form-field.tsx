import { AlertCircle } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type ControlProps = {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
}

type FormFieldProps = {
  id: string
  label: string
  hint?: string
  error?: string | undefined
  className?: string
  children: (control: ControlProps) => React.ReactNode
}

/** Label above, hint and error below; the error never relies on color alone (DESIGN_SPEC.md 5.2). */
export function FormField({ id, label, hint, error, className, children }: FormFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm font-medium">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  )
}
