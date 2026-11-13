import { Bell, BellOff, BellRing, Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { usePushKeyQuery } from '@/features/push/queries'
import { usePushDevice } from '@/features/push/use-push-device'
import { toApiError } from '@/lib/api/errors'

import type { PushDevice } from '@/features/push/use-push-device'

function describe(device: PushDevice): { icon: typeof Bell; text: string } {
  if (!device.support.supported) {
    return {
      icon: BellOff,
      text:
        device.support.reason === 'insecure'
          ? 'Notifikasi hanya bisa diaktifkan lewat HTTPS atau localhost.'
          : 'Peramban ini tidak mendukung notifikasi. Di iPhone, tambahkan situs ke layar utama dulu.',
    }
  }
  switch (device.status) {
    case 'on':
      return { icon: BellRing, text: 'Aktif di perangkat ini.' }
    case 'denied':
      return {
        icon: BellOff,
        text: 'Diblokir. Ubah izin notifikasi untuk situs ini di pengaturan peramban, lalu muat ulang halaman.',
      }
    case 'off':
      return { icon: Bell, text: 'Belum diaktifkan di perangkat ini.' }
    case 'checking':
      return { icon: Bell, text: 'Memeriksa perangkat...' }
  }
}

function PushControls({ publicKey }: { publicKey: string }) {
  const device = usePushDevice(publicKey)
  const { icon: Icon, text } = describe(device)
  const canToggle = device.support.supported && (device.status === 'on' || device.status === 'off')

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
        <span role="status">{text}</span>
      </p>

      {device.problem ? (
        <Alert variant="destructive" role="alert">
          <TriangleAlert aria-hidden />
          <AlertDescription>{device.problem}</AlertDescription>
        </Alert>
      ) : null}

      {canToggle ? (
        <Button
          type="button"
          size="lg"
          variant={device.status === 'on' ? 'outline' : 'default'}
          disabled={device.isBusy}
          onClick={() => {
            const wasOn = device.status === 'on'
            void (wasOn ? device.disable() : device.enable()).then((worked) => {
              if (worked) toast.success(wasOn ? 'Notifikasi dimatikan' : 'Notifikasi diaktifkan')
            })
          }}
        >
          {device.isBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {device.status === 'on' ? 'Matikan notifikasi' : 'Aktifkan notifikasi'}
        </Button>
      ) : null}
    </div>
  )
}

/** "Notifikasi di perangkat ini". Hidden entirely when the server has Web Push turned off. */
export function PushSettings() {
  const key = usePushKeyQuery()

  // 404 = Web Push is off on the server: nothing to offer, and nothing to apologise for.
  if (key.isError && toApiError(key.error).status === 404) return null
  // Until the answer is in, show nothing: a heading that vanishes again would only flicker.
  if (key.isPending) return null

  return (
    <section aria-labelledby="push-title" className="space-y-3">
      <h2 id="push-title" className="text-2xl font-semibold tracking-tight">
        Notifikasi di perangkat ini
      </h2>
      <p className="text-muted-foreground">
        Terima pemberitahuan reservasi baru dan pengingat, bahkan saat halaman ini tertutup.
      </p>
      {key.isError ? <ErrorState error={key.error} onRetry={() => void key.refetch()} /> : null}
      {key.isSuccess ? <PushControls publicKey={key.data} /> : null}
    </section>
  )
}
