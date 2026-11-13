import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it, vi } from 'vitest'

type Listener = (event: unknown) => void

/** Runs public/sw.js against a stand-in for the service worker global scope. */
function loadWorker(
  clients: {
    url: string
    navigate: ReturnType<typeof vi.fn>
    focus: ReturnType<typeof vi.fn>
  }[] = [],
) {
  const listeners: Record<string, Listener> = {}
  const showNotification = vi.fn<(title: string, options?: unknown) => Promise<void>>(() =>
    Promise.resolve(),
  )
  const openWindow = vi.fn<(url: string) => Promise<void>>(() => Promise.resolve())
  const scope = {
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener
    },
    registration: { showNotification },
    clients: { matchAll: vi.fn(() => Promise.resolve(clients)), openWindow },
    location: { origin: 'https://app.test' },
  }
  const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
  new Function('self', source)(scope)
  return { listeners, showNotification, openWindow }
}

function pushEvent(payload: unknown) {
  const waited: Promise<unknown>[] = []
  return {
    event: {
      data: { json: () => payload },
      waitUntil: (promise: Promise<unknown>) => waited.push(promise),
    },
    done: () => Promise.all(waited),
  }
}

describe('public/sw.js', () => {
  it('shows the notification the API sent, linked to its reservation', async () => {
    const { listeners, showNotification } = loadWorker()
    const { event, done } = pushEvent({
      notification_id: 'n1',
      booking_id: 'b1',
      type: 'new_booking',
      title: 'Reservasi baru',
      body: 'Siti memesan Gel Polish',
    })

    listeners.push?.(event)
    await done()

    expect(showNotification).toHaveBeenCalledWith('Reservasi baru', {
      body: 'Siti memesan Gel Polish',
      tag: 'n1',
      data: { url: '/admin/reservasi?id=b1' },
    })
  })

  it('falls back to the inbox when there is no reservation, and survives a bad payload', async () => {
    const { listeners, showNotification } = loadWorker()
    const first = pushEvent({ title: 'Pengingat', body: 'x' })
    listeners.push?.(first.event)
    await first.done()
    expect(showNotification.mock.calls[0]?.[1]).toMatchObject({
      data: { url: '/admin/notifikasi' },
    })

    const broken = {
      data: {
        json: () => {
          throw new Error('not json')
        },
      },
      waitUntil: vi.fn(),
    }
    listeners.push?.(broken)
    expect(showNotification.mock.calls[1]?.[0]).toBe('The Nail Palace')
  })

  it('focuses a tab that is already open on the site instead of opening another', async () => {
    const navigate = vi.fn(() => Promise.resolve({ focus: vi.fn() }))
    const { listeners, openWindow } = loadWorker([
      { url: 'https://app.test/admin', navigate, focus: vi.fn() },
    ])
    const waited: Promise<unknown>[] = []

    listeners.notificationclick?.({
      notification: { close: vi.fn(), data: { url: '/admin/reservasi?id=b1' } },
      waitUntil: (promise: Promise<unknown>) => waited.push(promise),
    })
    await Promise.all(waited)

    expect(navigate).toHaveBeenCalledWith('https://app.test/admin/reservasi?id=b1')
    expect(openWindow).not.toHaveBeenCalled()
  })

  it('opens a window when no tab of the site is open', async () => {
    const { listeners, openWindow } = loadWorker([])
    const waited: Promise<unknown>[] = []

    listeners.notificationclick?.({
      notification: { close: vi.fn(), data: { url: '/admin/notifikasi' } },
      waitUntil: (promise: Promise<unknown>) => waited.push(promise),
    })
    await Promise.all(waited)

    expect(openWindow).toHaveBeenCalledWith('https://app.test/admin/notifikasi')
  })
})
