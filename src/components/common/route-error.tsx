import { useRouter } from '@tanstack/react-router'

import { ErrorState } from './error-state'

type RouteErrorProps = { error: unknown; reset?: () => void }

export function RouteError({ error, reset }: RouteErrorProps) {
  const router = useRouter()
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="sr-only">Terjadi kendala</h1>
      <ErrorState
        error={error}
        onRetry={() => {
          reset?.()
          void router.invalidate()
        }}
      />
    </div>
  )
}
