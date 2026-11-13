import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { Toaster } from '@/components/ui/sonner'
import { installFakePush } from '@/test/fake-push'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { PushSettings } from './push-settings'

// A short, valid base64url key.
const KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-ib37J8xQmrTvG0'

let fake: ReturnType<typeof installFakePush> | undefined
afterEach(() => fake?.restore())

function serveKey() {
  server.use(
    http.get(`${API}/admin/push/public-key`, () =>
      HttpResponse.json({ data: { public_key: KEY } }),
    ),
  )
}

function captureSubscriptions() {
  const calls: { method: string; body: unknown }[] = []
  server.use(
    http.post(`${API}/admin/push-subscriptions`, async ({ request }) => {
      calls.push({ method: 'POST', body: await request.json() })
      return HttpResponse.json({ data: { id: 'x' } }, { status: 201 })
    }),
    http.delete(`${API}/admin/push-subscriptions`, async ({ request }) => {
      calls.push({ method: 'DELETE', body: await request.json() })
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return calls
}

async function render() {
  await renderWithRouter(
    <>
      <PushSettings />
      <Toaster />
    </>,
  )
}

describe('PushSettings', () => {
  it('shows nothing when the server has Web Push turned off (404)', async () => {
    fake = installFakePush()
    server.use(
      http.get(`${API}/admin/push/public-key`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'x' } }, { status: 404 }),
      ),
    )
    await render()

    await waitFor(() =>
      expect(screen.queryByText('Notifikasi di perangkat ini')).not.toBeInTheDocument(),
    )
    expect(screen.queryByText(/kesalahan/)).not.toBeInTheDocument()
  })

  it('explains a browser without push support', async () => {
    fake = installFakePush({ unsupported: true })
    serveKey()
    await render()

    expect(await screen.findByText(/tidak mendukung notifikasi/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /notifikasi/i })).not.toBeInTheDocument()
  })

  it('explains that push needs HTTPS or localhost', async () => {
    fake = installFakePush({ secure: false })
    serveKey()
    await render()
    expect(await screen.findByText(/HTTPS atau localhost/)).toBeInTheDocument()
  })

  it('turns notifications on: worker, permission, subscription, then the server', async () => {
    fake = installFakePush()
    serveKey()
    const calls = captureSubscriptions()
    const user = userEvent.setup()
    await render()

    expect(await screen.findByText('Belum diaktifkan di perangkat ini.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Aktifkan notifikasi' }))

    expect(await screen.findByText('Aktif di perangkat ini.')).toBeInTheDocument()
    expect(fake.register).toHaveBeenCalledWith('/sw.js')
    expect(fake.requestPermission).toHaveBeenCalled()
    expect(fake.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      }),
    )
    expect(calls).toEqual([
      {
        method: 'POST',
        body: {
          endpoint: 'https://push.test/abc',
          keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
        },
      },
    ])
    expect(await screen.findByText('Notifikasi diaktifkan')).toBeInTheDocument()
  })

  it('shows what to do when the person refuses the permission prompt', async () => {
    fake = installFakePush({ promptResult: 'denied' })
    serveKey()
    const calls = captureSubscriptions()
    const user = userEvent.setup()
    await render()

    await user.click(await screen.findByRole('button', { name: 'Aktifkan notifikasi' }))

    expect(await screen.findByText(/Izin notifikasi ditolak/)).toBeInTheDocument()
    expect(screen.getByText(/Diblokir/)).toBeInTheDocument()
    expect(calls).toHaveLength(0)
    expect(fake.subscribe).not.toHaveBeenCalled()
  })

  it('does not offer a button when the browser already blocks notifications', async () => {
    fake = installFakePush({ permission: 'denied' })
    serveKey()
    await render()

    expect(await screen.findByText(/Diblokir\. Ubah izin notifikasi/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aktifkan notifikasi' })).not.toBeInTheDocument()
  })

  it('turns notifications off here and tells the server which endpoint to forget', async () => {
    fake = installFakePush({ permission: 'granted', subscribed: true })
    serveKey()
    const calls = captureSubscriptions()
    const user = userEvent.setup()
    await render()

    expect(await screen.findByText('Aktif di perangkat ini.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Matikan notifikasi' }))

    expect(await screen.findByText('Belum diaktifkan di perangkat ini.')).toBeInTheDocument()
    expect(fake.subscription.unsubscribe).toHaveBeenCalled()
    expect(calls).toEqual([{ method: 'DELETE', body: { endpoint: 'https://push.test/abc' } }])
  })

  it('reports an unsupported browser rejected by the server (422) and keeps no stray subscription', async () => {
    fake = installFakePush()
    serveKey()
    server.use(
      http.post(`${API}/admin/push-subscriptions`, () =>
        HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'x' } }, { status: 422 }),
      ),
    )
    const user = userEvent.setup()
    await render()

    await user.click(await screen.findByRole('button', { name: 'Aktifkan notifikasi' }))

    expect(await screen.findByText(/tidak didukung untuk notifikasi/)).toBeInTheDocument()
    expect(fake.subscription.unsubscribe).toHaveBeenCalled()
    expect(screen.getByText('Belum diaktifkan di perangkat ini.')).toBeInTheDocument()
  })
})
