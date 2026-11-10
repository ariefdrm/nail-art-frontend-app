import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { API, server } from '@/test/server'

import { bootstrapSession, logout, startSession } from './session'
import { getAccessToken, setSessionHint } from './token-store'

describe('bootstrapSession', () => {
  it('skips the network for a browser that never signed in', async () => {
    // No handler registered: any request would fail the test.
    await expect(bootstrapSession()).resolves.toBe(false)
  })

  it('signs in from the cookie when a hint exists', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({
          data: { access_token: 'a1', refresh_token: 'r', token_type: 'Bearer', expires_in: 900 },
        }),
      ),
    )
    setSessionHint()
    await expect(bootstrapSession()).resolves.toBe(true)
    expect(getAccessToken()).toBe('a1')
  })

  it('answers false on 401 and drops the hint', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, { status: 401 }),
      ),
    )
    setSessionHint()
    await expect(bootstrapSession()).resolves.toBe(false)
    expect(localStorage.getItem('np.session')).toBeNull()
  })

  it('lets a forbidden origin surface', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'x' } }, { status: 403 }),
      ),
    )
    setSessionHint()
    await expect(bootstrapSession()).rejects.toMatchObject({ code: 'ORIGIN_NOT_ALLOWED' })
  })
})

describe('logout', () => {
  it('calls the backend with no body, then forgets the token', async () => {
    let body = 'unset'
    server.use(
      http.post(`${API}/auth/logout`, async ({ request }) => {
        body = await request.text()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    startSession({ access_token: 'a', expires_in: 900 })
    await logout()
    expect(body).toBe('')
    expect(getAccessToken()).toBeNull()
    expect(localStorage.getItem('np.session')).toBeNull()
  })
})
