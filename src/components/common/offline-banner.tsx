import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { ERROR_COPY } from '@/lib/copy'

function subscribe(listener: () => void): () => void {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )

  return (
    <div role="status" aria-live="polite">
      {isOnline ? null : (
        <div className="flex items-center justify-center gap-2 border-b border-border bg-muted px-4 py-2 text-sm font-medium">
          <WifiOff className="size-4" aria-hidden />
          {ERROR_COPY.network}
        </div>
      )}
    </div>
  )
}
