import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { API, server } from '@/test/server'

import { SessionExpiredError, refreshAccessToken } from './refresh'
import { getAccessToken, setAccessToken } from './token-store'

function grant(n: number) {
  return {
    data: {
      access_token: `access-${n}`,
      // The body still carries it; the app must ignore it.
      refresh_token: `secret-refresh-${n}`,
      token_type: 'Bearer',
      expires_in: 900,
    },
  }
}

const otherTab = new BroadcastChannel('np-auth')
afterEach(() => {
  otherTab.onmessage = null
})

describe('refreshAccessToken', () => {
  it('shares one cookie request between concurrent callers, with no body and credentials', async () => {
    let calls = 0
    let sawBody = 'unset'
    let credentials = ''
    server.use(
      http.post(`${API}/auth/refresh`, async ({ request }) => {
        calls += 1
        sawBody = await request.text()
        credentials = request.credentials
        return HttpResponse.json(grant(1))
      }),
    )

    const [a, b] = await Promise.all([refreshAccessToken(), refreshAccessToken()])

    expect(calls).toBe(1)
    expect([a, b]).toEqual(['access-1', 'access-1'])
    expect(sawBody).toBe('')
    expect(credentials).toBe('include')
    expect(getAccessToken()).toBe('access-1')
  })

  it('never writes the refresh token from the body to browser storage', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json(grant(1))))
    await refreshAccessToken()
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })
    expect(stored).not.toContain('secret-refresh')
    expect(localStorage.getItem('np.refresh')).toBeNull()
  })

  it('does not call the network while the access token is fresh', async () => {
    let calls = 0
    server.use(
      http.post(`${API}/auth/refresh`, () => {
        calls += 1
        return HttpResponse.json(grant(calls))
      }),
    )
    await refreshAccessToken()
    await refreshAccessToken()
    expect(calls).toBe(1)
  })

  it('refreshes again when the current token was rejected by the server', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json(grant(2))))
    setAccessToken('stale', 900)
    await expect(refreshAccessToken({ rejected: 'stale' })).resolves.toBe('access-2')
  })

  it('takes a token another tab shares instead of using the cookie', async () => {
    // No refresh handler: an unexpected network call would fail the test.
    otherTab.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data.type === 'need-token') {
        otherTab.postMessage({
          type: 'token',
          access_token: 'from-other-tab',
          expires_at: Date.now() + 600_000,
        })
      }
    }
    await expect(refreshAccessToken()).resolves.toBe('from-other-tab')
    expect(getAccessToken()).toBe('from-other-tab')
  })

  it('shares a freshly rotated token with the other tabs', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json(grant(3))))
    const received = new Promise<{ access_token: string }>((resolve) => {
      otherTab.onmessage = (event: MessageEvent<{ type: string; access_token: string }>) => {
        if (event.data.type === 'token') resolve(event.data)
      }
    })
    await refreshAccessToken()
    expect((await received).access_token).toBe('access-3')
  })

  it('expires the session on 401 (cookie missing or revoked)', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, { status: 401 }),
      ),
    )
    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError)
    expect(getAccessToken()).toBeNull()
  })

  it('reports a forbidden origin as a configuration error, not an expired session', async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Origin' } }, { status: 403 }),
      ),
    )
    localStorage.setItem('np.session', '1')
    const error: unknown = await refreshAccessToken().catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(SessionExpiredError)
    expect(error).toMatchObject({ code: 'ORIGIN_NOT_ALLOWED', status: 403 })
    expect(localStorage.getItem('np.session')).toBe('1')
  })

  it('keeps the session on a server error', async () => {
    server.use(http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 503 })))
    localStorage.setItem('np.session', '1')
    await expect(refreshAccessToken()).rejects.not.toBeInstanceOf(SessionExpiredError)
    expect(localStorage.getItem('np.session')).toBe('1')
  })
})
