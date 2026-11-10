import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  error: unknown
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle aria-hidden />
      <AlertTitle>Terjadi kendala</AlertTitle>
      <AlertDescription>
        <p>{errorMessage(error)}</p>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            Coba lagi
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
