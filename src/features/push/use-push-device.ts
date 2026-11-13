import { useEffect, useState } from 'react'

import { toApiError } from '@/lib/api/errors'
import { getPushSupport } from '@/lib/push/support'

import {
  PushPermissionError,
  hasDeviceSubscription,
  subscribeDevice,
  unsubscribeDevice,
} from './device'
import { useRegisterSubscriptionMutation, useRemoveSubscriptionMutation } from './queries'

import type { PushSupport } from '@/lib/push/support'

export type DeviceStatus = 'checking' | 'off' | 'on' | 'denied'

export type PushDevice = {
  support: PushSupport
  status: DeviceStatus
  isBusy: boolean
  /** A message for the person when the last attempt failed. */
  problem: string | null
  /** Resolve to whether it worked, so the caller can confirm with a toast. */
  enable: () => Promise<boolean>
  disable: () => Promise<boolean>
}

/** This browser's push state and the two things a person can do about it. */
export function usePushDevice(publicKey: string): PushDevice {
  const support = getPushSupport()
  const [status, setStatus] = useState<DeviceStatus>('checking')
  const [problem, setProblem] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const register = useRegisterSubscriptionMutation()
  const remove = useRemoveSubscriptionMutation()
  const isSupported = support.supported

  useEffect(() => {
    if (!isSupported) return
    let cancelled = false
    void hasDeviceSubscription().then((subscribed) => {
      if (cancelled) return
      if (subscribed) setStatus('on')
      else setStatus(Notification.permission === 'denied' ? 'denied' : 'off')
    })
    return () => {
      cancelled = true
    }
  }, [isSupported])

  async function enable(): Promise<boolean> {
    setProblem(null)
    setIsBusy(true)
    try {
      const body = await subscribeDevice(publicKey)
      try {
        await register.mutateAsync(body)
      } catch (error) {
        // The server did not take it: do not keep a subscription it knows nothing about.
        await unsubscribeDevice()
        throw error
      }
      setStatus('on')
      return true
    } catch (error) {
      if (error instanceof PushPermissionError) {
        setStatus(error.permission === 'denied' ? 'denied' : 'off')
        setProblem(
          error.permission === 'denied'
            ? 'Izin notifikasi ditolak. Ubah izin situs di pengaturan peramban bila ingin mengaktifkannya.'
            : 'Izin notifikasi belum diberikan.',
        )
      } else if (toApiError(error).status === 422) {
        setProblem('Peramban atau perangkat ini tidak didukung untuk notifikasi.')
      } else {
        setProblem('Notifikasi belum bisa diaktifkan. Coba lagi sebentar lagi.')
      }
      return false
    } finally {
      setIsBusy(false)
    }
  }

  async function disable(): Promise<boolean> {
    setProblem(null)
    setIsBusy(true)
    try {
      const endpoint = await unsubscribeDevice()
      if (endpoint) await remove.mutateAsync(endpoint)
      setStatus('off')
      return true
    } catch {
      setProblem('Notifikasi belum bisa dimatikan. Coba lagi sebentar lagi.')
      return false
    } finally {
      setIsBusy(false)
    }
  }

  return { support, status, isBusy, problem, enable, disable }
}
