import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { onSessionExpired } from '@/lib/auth/session'
import { setAccessToken } from '@/lib/auth/token-store'
import { API, server } from '@/test/server'

import { api } from './client'
import { ApiError } from './errors'

const unauthorized = () =>
  HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, { status: 401 })

describe('api client', () => {
  it('refreshes once on 401 and retries with the new bearer token', async () => {
    const seen: (string | null)[] = []
    let refreshes = 0
    server.use(
      http.get(`${API}/admin/bookings`, ({ request }) => {
        const auth = request.headers.get('authorization')
        seen.push(auth)
        return auth === 'Bearer new-access' ? HttpResponse.json({ data: [] }) : unauthorized()
      }),
      http.post(`${API}/auth/refresh`, () => {
        refreshes += 1
        return HttpResponse.json({
          data: {
            access_token: 'new-access',
            refresh_token: 'new-refresh',
            token_type: 'Bearer',
            expires_in: 900,
          },
        })
      }),
    )
    setAccessToken('old-access', 900)

    const res = await api.get('/admin/bookings')

    expect(res.data).toEqual({ data: [] })
    expect(refreshes).toBe(1)
    expect(seen).toEqual(['Bearer old-access', 'Bearer new-access'])
  })

  it('does not loop when the retry is also 401', async () => {
    let requests = 0
    server.use(
      http.get(`${API}/admin/bookings`, () => {
        requests += 1
        return unauthorized()
      }),
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({
          data: { access_token: 'a', refresh_token: 'r', token_type: 'Bearer', expires_in: 900 },
        }),
      ),
    )
    setAccessToken('old', 900)

    await expect(api.get('/admin/bookings')).rejects.toBeInstanceOf(ApiError)
    expect(requests).toBe(2)
  })

  it('signals an expired session when the refresh token is rejected', async () => {
    let expired = 0
    const off = onSessionExpired(() => {
      expired += 1
    })
    server.use(
      http.get(`${API}/admin/bookings`, unauthorized),
      http.post(`${API}/auth/refresh`, unauthorized),
    )
    setAccessToken('old', 900)

    await expect(api.get('/admin/bookings')).rejects.toMatchObject({ status: 401 })
    expect(expired).toBe(1)
    off()
  })

  it('does not try to refresh a failed login', async () => {
    server.use(http.post(`${API}/auth/login`, unauthorized))
    await expect(api.post('/auth/login', {})).rejects.toMatchObject({ status: 401 })
  })

  it('sends no bearer token to public endpoints', async () => {
    let auth: string | null = 'unset'
    server.use(
      http.get(`${API}/services`, ({ request }) => {
        auth = request.headers.get('authorization')
        return HttpResponse.json({ data: [] })
      }),
    )
    setAccessToken('secret', 900)
    await api.get('/services')
    expect(auth).toBeNull()
  })
})
